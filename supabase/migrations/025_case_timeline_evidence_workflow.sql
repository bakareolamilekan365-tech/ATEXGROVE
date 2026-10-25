-- Correct event classification and enforce linear, same-case evidence replacement.
-- Forward-only: hosted baseline was verified at migration 024.

alter table public.case_status_events
  drop constraint case_status_events_event_kind_check;

alter table public.case_status_events
  add constraint case_status_events_event_kind_check
  check (event_kind in (
    'status_change',
    'staff_note',
    'customer_message',
    'information_requested',
    'customer_response',
    'document_uploaded'
  ));

-- Existing hosted data was checked before adding this invariant: there are no
-- predecessor rows with multiple successors. The case-row lock in the RPC
-- serializes registrations for one case; this index is the final no-fork guard.
create unique index case_evidence_single_successor_idx
  on public.case_evidence (supersedes_evidence_id)
  where supersedes_evidence_id is not null;

create or replace function public.register_case_evidence(
  p_evidence_id uuid,
  p_case_id uuid,
  p_evidence_type text,
  p_description text,
  p_storage_path text,
  p_original_filename text,
  p_mime_type text,
  p_size_bytes bigint,
  p_supersedes_evidence_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  case_row public.verification_cases%rowtype;
  predecessor public.case_evidence%rowtype;
  next_version integer := 1;
  evidence_label text;
  event_reason text;
begin
  if actor_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  select * into case_row
  from public.verification_cases
  where id = p_case_id
  for update;

  if not found then
    raise exception 'Verification case not found' using errcode = 'P0002';
  end if;
  if case_row.customer_user_id <> actor_id then
    raise exception 'Only the case customer can add evidence' using errcode = '42501';
  end if;
  if case_row.workflow_status not in ('draft', 'submitted', 'assigned', 'in_review', 'needs_customer_info') then
    raise exception 'This case is not accepting evidence' using errcode = '22023';
  end if;
  if p_evidence_type not in ('title_deed_copy', 'survey_plan_copy', 'receipt', 'seller_id', 'other') then
    raise exception 'Unsupported evidence type' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_description, ''))) not between 2 and 500 then
    raise exception 'Description must be between 2 and 500 characters' using errcode = '22023';
  end if;
  if p_mime_type not in ('application/pdf', 'image/jpeg', 'image/png') then
    raise exception 'Unsupported file type' using errcode = '22023';
  end if;
  if p_size_bytes <= 0 or p_size_bytes > 10485760 then
    raise exception 'File must be no larger than 10 MB' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_original_filename, ''))) not between 1 and 255 then
    raise exception 'Invalid original filename' using errcode = '22023';
  end if;
  if public.document_case_id_from_path(p_storage_path) is distinct from p_case_id
    or public.document_evidence_id_from_path(p_storage_path) is distinct from p_evidence_id then
    raise exception 'Invalid evidence storage path' using errcode = '22023';
  end if;
  if not exists (
    select 1 from storage.objects
    where bucket_id = 'documents' and name = p_storage_path
  ) then
    raise exception 'Evidence object was not uploaded' using errcode = '22023';
  end if;
  if (select count(*) from public.case_evidence where verification_case_id = p_case_id) >= 10 then
    raise exception 'A case can have at most 10 files' using errcode = '22023';
  end if;

  if p_supersedes_evidence_id is not null then
    select * into predecessor
    from public.case_evidence
    where id = p_supersedes_evidence_id
      and verification_case_id = p_case_id
    for update;

    if not found then
      raise exception 'Superseded evidence must belong to this case' using errcode = '22023';
    end if;
    if predecessor.evidence_type <> p_evidence_type then
      raise exception 'A replacement must keep the same evidence type' using errcode = '22023';
    end if;
    if exists (
      select 1 from public.case_evidence
      where supersedes_evidence_id = predecessor.id
    ) then
      raise exception 'This version already has a replacement; select the latest version' using errcode = '23505';
    end if;
    next_version := predecessor.version + 1;
  end if;

  insert into public.case_evidence (
    id, verification_case_id, uploaded_by_user_id, evidence_type, description,
    storage_path, original_filename, mime_type, size_bytes, version,
    supersedes_evidence_id
  ) values (
    p_evidence_id, p_case_id, actor_id, p_evidence_type, btrim(p_description),
    p_storage_path, btrim(p_original_filename), p_mime_type, p_size_bytes,
    next_version, p_supersedes_evidence_id
  );

  evidence_label := case p_evidence_type
    when 'title_deed_copy' then 'Title deed copy'
    when 'survey_plan_copy' then 'Survey plan copy'
    when 'receipt' then 'Receipt'
    when 'seller_id' then 'ID of seller'
    else 'Other'
  end;
  event_reason := case
    when p_supersedes_evidence_id is null then evidence_label || ' uploaded'
    else evidence_label || ' updated with replacement version ' || next_version::text
  end;

  -- Ordinary activity keeps the current status values for audit context but is
  -- explicitly typed as an upload, never as a workflow transition.
  insert into public.case_status_events (
    verification_case_id, actor_user_id, from_status, to_status, reason,
    customer_visible, event_kind
  ) values (
    p_case_id, actor_id, case_row.workflow_status, case_row.workflow_status,
    event_reason, true, 'document_uploaded'
  );

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    actor_id, 'case_evidence.created', 'case_evidence', p_evidence_id,
    jsonb_build_object(
      'verification_case_id', p_case_id,
      'evidence_type', p_evidence_type,
      'version', next_version,
      'source', 'customer_supplied',
      'is_demo_data', true
    )
  );
  return p_evidence_id;
end;
$$;

create or replace function public.customer_respond_to_case(
  p_case_id uuid,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  case_row public.verification_cases%rowtype;
  status_event_id uuid;
  response_event_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_message, ''))) not between 2 and 2000 then
    raise exception 'A response message is required' using errcode = '22023';
  end if;

  select * into case_row
  from public.verification_cases
  where id = p_case_id
  for update;

  if not found then
    raise exception 'Verification case not found' using errcode = 'P0002';
  end if;
  if case_row.customer_user_id <> actor_id then
    raise exception 'Only the case customer can respond' using errcode = '42501';
  end if;
  if case_row.workflow_status in ('closed', 'cancelled') then
    raise exception 'Closed or cancelled cases cannot accept customer responses' using errcode = '22023';
  end if;
  if case_row.workflow_status <> 'needs_customer_info' then
    raise exception 'The case is not waiting for customer information' using errcode = '22023';
  end if;

  update public.verification_cases
  set workflow_status = 'in_review'
  where id = p_case_id;

  -- Keep the safe transition and actual customer response as separate records;
  -- distinct event kinds let the timeline present them without duplicate labels.
  insert into public.case_status_events (
    verification_case_id, actor_user_id, from_status, to_status, reason,
    customer_visible, event_kind, created_at
  ) values (
    p_case_id, actor_id, 'needs_customer_info', 'in_review',
    'Your case is now in review.', true, 'status_change', clock_timestamp()
  ) returning id into status_event_id;

  insert into public.case_status_events (
    verification_case_id, actor_user_id, from_status, to_status, reason,
    customer_visible, event_kind, created_at
  ) values (
    p_case_id, actor_id, 'needs_customer_info', 'in_review',
    btrim(p_message), true, 'customer_response', clock_timestamp()
  ) returning id into response_event_id;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    actor_id, 'verification_case.customer_responded', 'verification_case', p_case_id,
    jsonb_build_object('status_event_id', status_event_id, 'response_event_id', response_event_id)
  );
  return response_event_id;
end;
$$;

revoke execute on function public.register_case_evidence(uuid, uuid, text, text, text, text, text, bigint, uuid)
  from public, anon;
grant execute on function public.register_case_evidence(uuid, uuid, text, text, text, text, text, bigint, uuid)
  to authenticated;
revoke execute on function public.customer_respond_to_case(uuid, text)
  from public, anon;
grant execute on function public.customer_respond_to_case(uuid, text)
  to authenticated;
