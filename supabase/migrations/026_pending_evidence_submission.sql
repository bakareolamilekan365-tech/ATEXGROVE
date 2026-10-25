-- Uploading saves private preparation; only explicit customer submission releases it.
-- Forward-only after hosted migration 025. No historical event/audit rows changed.

alter table public.case_status_events
  add column response_to_event_id uuid references public.case_status_events(id) on delete restrict;
create unique index case_response_per_request_idx on public.case_status_events(response_to_event_id)
  where response_to_event_id is not null;

alter table public.verification_cases
  add column information_request_event_id uuid references public.case_status_events(id) on delete restrict;
-- Preserve the latest real request for cases already awaiting information. Its
-- fixed milestone wins over the optional companion message in the same transaction.
update public.verification_cases vc set information_request_event_id = (
  select e.id from public.case_status_events e
  where e.verification_case_id = vc.id and e.to_status = 'needs_customer_info'
    and e.customer_visible and e.event_kind in ('information_requested', 'status_change')
  order by e.created_at desc,
    (e.reason = 'The review team needs more information from you.') desc, e.id desc limit 1
) where vc.workflow_status = 'needs_customer_info';

alter table public.case_evidence
  add column submitted_at timestamptz,
  add column submission_event_id uuid references public.case_status_events(id) on delete restrict;
-- Already-visible legacy evidence stays visible. This timestamp is compatibility
-- provenance (creation time), not a claim that historical explicit consent existed.
-- Draft/discarded evidence remains pending. Never infer state from case status again.
update public.case_evidence ce set submitted_at = ce.created_at
from public.verification_cases vc where ce.verification_case_id = vc.id
  and vc.workflow_status <> 'draft' and vc.discarded_at is null;
alter table public.case_evidence add constraint case_evidence_submission_check
  check (submission_event_id is null or submitted_at is not null);

-- Counts, embedded joins and direct REST reads all use the same per-row boundary.
drop policy "Customers and scoped staff can read case evidence" on public.case_evidence;
create policy "Customers and scoped staff can read case evidence"
  on public.case_evidence for select to authenticated using (
    exists (select 1 from public.verification_cases vc
      where vc.id = verification_case_id and vc.customer_user_id = (select auth.uid()))
    or (submitted_at is not null and (select public.staff_can_access_verification_case(verification_case_id)))
  );

-- An application administrator is still an end-user identity, not a database
-- operator. Audit-list access must not become a pending evidence/draft side channel.
drop policy "Admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs" on public.audit_logs for select to authenticated using (
  (select public.is_admin()) and case entity_type
    when 'case_evidence' then exists (
      select 1 from public.case_evidence ce where ce.id = entity_id
        and ce.submitted_at is not null
        and public.staff_can_access_verification_case(ce.verification_case_id))
    when 'verification_case' then public.staff_can_access_verification_case(entity_id)
    else true end
);

-- Historical upload events remain stored and owner-readable, but never expose
-- private preparation to staff through the event API. New uploads write audits only.
drop policy "Customers and scoped staff can read case status events" on public.case_status_events;
create policy "Customers and scoped staff can read case status events"
  on public.case_status_events for select to authenticated using (
    ((select public.staff_can_access_verification_case(verification_case_id))
      and event_kind <> 'document_uploaded'
      and not (event_kind = 'status_change' and from_status = to_status and reason like 'Document added: %'))
    or (customer_visible and exists (select 1 from public.verification_cases vc
      where vc.id = verification_case_id and vc.customer_user_id = (select auth.uid())))
  );

-- No direct object SELECT/UPDATE/DELETE is granted; server download signing must
-- continue to go through the audited RPC. Restrict new uploads to preparation windows.
drop policy "Customers can upload evidence for their cases" on storage.objects;
create policy "Customers can upload evidence for their cases"
  on storage.objects for insert to authenticated with check (
    bucket_id = 'documents' and public.document_case_id_from_path(name) is not null
    and exists (select 1 from public.verification_cases vc
      where vc.id = public.document_case_id_from_path(name)
        and vc.customer_user_id = (select auth.uid()) and vc.discarded_at is null
        and vc.workflow_status in ('draft', 'needs_customer_info')
        and (select count(*) from public.case_evidence ce where ce.verification_case_id = vc.id) < 10)
  );

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
  if case_row.discarded_at is not null or case_row.workflow_status not in ('draft', 'needs_customer_info') then
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

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    actor_id, 'case_evidence.created', 'case_evidence', p_evidence_id,
    jsonb_build_object(
      'verification_case_id', p_case_id,
      'evidence_type', p_evidence_type,
      'version', next_version,
      'supersedes_evidence_id', p_supersedes_evidence_id,
      'submission_state', 'pending_customer',
      'source', 'customer_supplied',
      'is_demo_data', true
    )
  );
  return p_evidence_id;
end;
$$;

create or replace function public.submit_verification_case(p_case_id uuid, p_notice_version text, p_accepted boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  case_row public.verification_cases%rowtype;
  next_number integer;
  new_submission_event_id uuid;
  released_ids uuid[];
  submission_year integer := extract(year from timezone('Africa/Lagos', transaction_timestamp()))::integer;
  selected_version constant text := 'case-service-scope-v1';
begin
  if actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  if p_accepted is distinct from true then raise exception 'Service scope acceptance is required' using errcode = '22023'; end if;
  if p_notice_version is distinct from selected_version then raise exception 'The service notice has changed; review and accept the current notice' using errcode = '22023'; end if;
  select * into case_row from public.verification_cases where id = p_case_id for update;
  if not found then raise exception 'Verification case not found' using errcode = 'P0002'; end if;
  if case_row.customer_user_id <> actor_id then raise exception 'Only the case customer can submit' using errcode = '42501'; end if;
  if case_row.discarded_at is not null then raise exception 'Discarded drafts cannot be submitted' using errcode = '22023'; end if;
  if case_row.workflow_status not in ('draft', 'submitted') then raise exception 'Only a draft can be submitted' using errcode = '22023'; end if;

  if case_row.workflow_status = 'submitted' then
    if case_row.case_number is null then raise exception 'Submitted case is missing its case number' using errcode = '55000'; end if;
    return p_case_id;
  end if;

  insert into public.case_consents(verification_case_id, customer_user_id, consent_type, notice_version)
  values(p_case_id, actor_id, 'case_service_scope', selected_version)
  on conflict (verification_case_id, consent_type) do nothing;

  insert into public.verification_case_number_counters(year, last_number)
  values(submission_year, 1)
  on conflict (year) do update
    set last_number = public.verification_case_number_counters.last_number + 1
    where public.verification_case_number_counters.last_number < 999999
  returning last_number into next_number;
  if next_number is null then raise exception 'Case number capacity for this year is exhausted' using errcode = '54000'; end if;

  update public.verification_cases
  set workflow_status = 'submitted',
      case_number = 'ATX-LV-' || submission_year::text || '-' || lpad(next_number::text, 6, '0')
  where id = p_case_id;
  insert into public.case_status_events(verification_case_id, actor_user_id, from_status, to_status, reason, customer_visible, event_kind)
  values(p_case_id, actor_id, 'draft', 'submitted', 'Request submitted by customer.', true, 'status_change') returning id into new_submission_event_id;
  with released as (
    update public.case_evidence set submitted_at = transaction_timestamp(), submission_event_id = new_submission_event_id
    where verification_case_id = p_case_id and submitted_at is null returning id
  ) select coalesce(array_agg(id), '{}'::uuid[]) into released_ids from released;
  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  values(actor_id, 'verification_case.submitted', 'verification_case', p_case_id, jsonb_build_object('submission_event_id', new_submission_event_id, 'released_evidence_ids', released_ids));
  return p_case_id;
end;
$$;
create or replace function public.transition_verification_case(
  p_case_id uuid,
  p_to_status text,
  p_staff_note text,
  p_customer_message text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  case_row public.verification_cases%rowtype;
  customer_status_event_id uuid;
  staff_note_event_id uuid;
  customer_message_event_id uuid;
  customer_status_reason text;
  clean_customer_message text := btrim(coalesce(p_customer_message, ''));
begin
  if actor_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;
  if not public.is_active_staff() then
    raise exception 'Active staff access is required' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_staff_note, ''))) not between 2 and 2000 then
    raise exception 'An internal staff note is required' using errcode = '22023';
  end if;
  if char_length(clean_customer_message) > 2000 then
    raise exception 'Customer message must not exceed 2000 characters' using errcode = '22023';
  end if;

  select * into case_row
  from public.verification_cases
  where id = p_case_id
  for update;

  if not found then
    raise exception 'Verification case not found' using errcode = 'P0002';
  end if;
  if not exists (
    select 1
    from public.case_assignments
    where verification_case_id = p_case_id
      and assignee_user_id = actor_id
      and status = 'active'
  ) then
    raise exception 'Only the active assignee can move this case' using errcode = '42501';
  end if;

  if not (
    (case_row.workflow_status = 'assigned' and p_to_status = 'in_review')
    or (case_row.workflow_status = 'in_review' and p_to_status in ('needs_customer_info', 'closed', 'cancelled'))
    -- Only the owner response RPC may resume review and release pending files.
    or (case_row.workflow_status = 'needs_customer_info' and p_to_status in ('closed', 'cancelled'))
  ) then
    raise exception 'Invalid verification case status transition: % -> %', case_row.workflow_status, p_to_status
      using errcode = '22023';
  end if;

  customer_status_reason := case p_to_status
    when 'in_review' then 'Your case is now in review.'
    when 'needs_customer_info' then 'The review team needs more information from you.'
    when 'closed' then 'This case was closed. No verification result was issued.'
    when 'cancelled' then 'This case was cancelled.'
  end;

  update public.verification_cases
  set workflow_status = p_to_status
  where id = p_case_id;

  if p_to_status in ('closed', 'cancelled') then
    update public.case_assignments
    set status = case when p_to_status = 'closed' then 'completed' else 'cancelled' end
    where verification_case_id = p_case_id
      and assignee_user_id = actor_id
      and status = 'active';
  end if;

  insert into public.case_status_events (
    verification_case_id,
    actor_user_id,
    from_status,
    to_status,
    reason,
    customer_visible,
    event_kind
  ) values (
    p_case_id,
    actor_id,
    case_row.workflow_status,
    p_to_status,
    customer_status_reason,
    true,
    case when p_to_status = 'needs_customer_info'
      then 'information_requested'
      else 'status_change'
    end
  ) returning id into customer_status_event_id;

  if p_to_status = 'needs_customer_info' then
    update public.verification_cases set information_request_event_id = customer_status_event_id where id = p_case_id;
  end if;

  insert into public.case_status_events (
    verification_case_id,
    actor_user_id,
    from_status,
    to_status,
    reason,
    customer_visible,
    event_kind
  ) values (
    p_case_id,
    actor_id,
    case_row.workflow_status,
    p_to_status,
    btrim(p_staff_note),
    false,
    'staff_note'
  ) returning id into staff_note_event_id;

  if clean_customer_message <> '' then
    insert into public.case_status_events (
      verification_case_id,
      actor_user_id,
      from_status,
      to_status,
      reason,
      customer_visible,
      event_kind
    ) values (
      p_case_id,
      actor_id,
      case_row.workflow_status,
      p_to_status,
      clean_customer_message,
      true,
      case when p_to_status = 'needs_customer_info'
        then 'information_requested'
        else 'customer_message'
      end
    ) returning id into customer_message_event_id;
  end if;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    actor_id,
    'verification_case.status_changed',
    'verification_case',
    p_case_id,
    jsonb_build_object(
      'from_status', case_row.workflow_status,
      'to_status', p_to_status,
      'customer_status_event_id', customer_status_event_id,
      'staff_note_event_id', staff_note_event_id,
      'customer_message_event_id', customer_message_event_id
    )
  );

  return customer_status_event_id;
end;
$$;


-- Fail closed for old app builds: they cannot implicitly select the current round.
drop function public.customer_respond_to_case(uuid, text);
create function public.customer_respond_to_case(p_case_id uuid, p_message text, p_request_event_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := (select auth.uid());
  case_row public.verification_cases%rowtype;
  existing_response public.case_status_events%rowtype;
  new_event_id uuid;
  released_ids uuid[];
begin
  if actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_message, ''))) not between 2 and 2000 then
    raise exception 'A response message is required' using errcode = '22023'; end if;
  select * into case_row from public.verification_cases where id = p_case_id for update;
  if not found then raise exception 'Verification case not found' using errcode = 'P0002'; end if;
  if case_row.customer_user_id <> actor_id then raise exception 'Only the case customer can respond' using errcode = '42501'; end if;
  if case_row.discarded_at is not null or case_row.workflow_status in ('closed', 'cancelled') then
    raise exception 'Closed or cancelled cases cannot accept customer responses' using errcode = '22023'; end if;
  if p_request_event_id is null then raise exception 'Refresh the information request before responding' using errcode = '22023'; end if;
  select * into existing_response from public.case_status_events
    where verification_case_id = p_case_id and response_to_event_id = p_request_event_id;
  if found then
    if existing_response.reason is distinct from btrim(p_message) then
      raise exception 'This information request already has a different response' using errcode = '22023'; end if;
    -- Never release anything on a retry, especially during a later request round.
    return existing_response.id;
  end if;
  if case_row.workflow_status <> 'needs_customer_info' then
    raise exception 'The case is not waiting for customer information' using errcode = '22023'; end if;
  if case_row.information_request_event_id is distinct from p_request_event_id then
    raise exception 'The information request has changed; refresh before responding' using errcode = '22023'; end if;

  insert into public.case_status_events(verification_case_id, actor_user_id, from_status,
    to_status, reason, customer_visible, event_kind, response_to_event_id)
  values(p_case_id, actor_id, 'needs_customer_info', 'in_review', btrim(p_message), true,
    'customer_response', p_request_event_id) returning id into new_event_id;
  with released as (
    update public.case_evidence set submitted_at = transaction_timestamp(), submission_event_id = new_event_id
    where verification_case_id = p_case_id and submitted_at is null returning id
  ) select coalesce(array_agg(id), '{}'::uuid[]) into released_ids from released;
  update public.verification_cases set workflow_status = 'in_review' where id = p_case_id;
  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  values(actor_id, 'verification_case.customer_responded', 'verification_case', p_case_id,
    jsonb_build_object('response_event_id', new_event_id, 'request_event_id', p_request_event_id,
      'released_evidence_ids', released_ids));
  return new_event_id;
end; $$;
revoke execute on function public.customer_respond_to_case(uuid, text, uuid) from public, anon;
grant execute on function public.customer_respond_to_case(uuid, text, uuid) to authenticated;

create or replace function public.authorize_case_evidence_download(p_evidence_id uuid)
returns table(storage_path text, original_filename text)
language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := (select auth.uid()); evidence_row public.case_evidence%rowtype;
begin
  if actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  select * into evidence_row from public.case_evidence where id = p_evidence_id;
  if not found then raise exception 'Evidence not found' using errcode = 'P0002'; end if;
  if not public.staff_can_access_verification_case(evidence_row.verification_case_id) then
    raise exception 'Staff access to this case is required' using errcode = '42501'; end if;
  if evidence_row.submitted_at is null then
    raise exception 'Evidence has not been submitted for review' using errcode = '42501'; end if;
  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  values(actor_id, 'document.accessed', 'case_evidence', evidence_row.id,
    jsonb_build_object('verification_case_id', evidence_row.verification_case_id));
  return query select evidence_row.storage_path, evidence_row.original_filename;
end; $$;

-- CREATE OR REPLACE preserves existing restricted ACLs on the other RPCs.
revoke execute on function public.register_case_evidence(uuid, uuid, text, text, text, text, text, bigint, uuid) from public, anon;
revoke execute on function public.submit_verification_case(uuid, text, boolean) from public, anon;
revoke execute on function public.transition_verification_case(uuid, text, text, text) from public, anon;
revoke execute on function public.authorize_case_evidence_download(uuid) from public, anon;
