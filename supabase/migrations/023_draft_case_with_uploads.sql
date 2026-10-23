-- Draft-first customer intake, scoped visibility, and customer cancellation.
-- Forward-only: migrations 001-022 are historical and remain unchanged.

-- Structured marker for a customer-discarded, unsubmitted draft. Ordinary
-- customer cancellations and draft submissions leave this null.
alter table public.verification_cases
  add column discarded_at timestamptz;

-- The helper is the common defense for staff reads of cases, assignments,
-- events, evidence, and the audited download RPC. Customers retain owner access.
create or replace function public.staff_can_access_verification_case(target_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.staff_members sm
      join public.verification_cases vc on vc.id = target_case_id
      where sm.user_id = (select auth.uid())
        and sm.active
        and vc.workflow_status <> 'draft'
        and vc.discarded_at is null
        and (
          (sm.is_lead and sm.department = vc.department)
          or exists (
            select 1 from public.case_assignments ca
            where ca.verification_case_id = vc.id
              and ca.assignee_user_id = sm.user_id
              and ca.status = 'active'
          )
        )
    );
$$;

revoke execute on function public.staff_can_access_verification_case(uuid) from public, anon;
grant execute on function public.staff_can_access_verification_case(uuid) to authenticated;

drop policy if exists "Customers and scoped staff can read verification cases" on public.verification_cases;
create policy "Customers and scoped staff can read verification cases"
  on public.verification_cases for select to authenticated
  using (
    customer_user_id = (select auth.uid())
    or (workflow_status <> 'draft' and (select public.staff_can_access_verification_case(id)))
  );

drop policy if exists "Scoped staff can read case assignments" on public.case_assignments;
create policy "Scoped staff can read case assignments"
  on public.case_assignments for select to authenticated
  using ((select public.staff_can_access_verification_case(verification_case_id)));

drop policy if exists "Customers and scoped staff can read case status events" on public.case_status_events;
create policy "Customers and scoped staff can read case status events"
  on public.case_status_events for select to authenticated
  using (
    (select public.staff_can_access_verification_case(verification_case_id))
    or (
      customer_visible and exists (
        select 1 from public.verification_cases vc
        where vc.id = verification_case_id
          and vc.customer_user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Customers and scoped staff can read case evidence" on public.case_evidence;
create policy "Customers and scoped staff can read case evidence"
  on public.case_evidence for select to authenticated
  using (
    exists (
      select 1 from public.verification_cases vc
      where vc.id = verification_case_id and vc.customer_user_id = (select auth.uid())
    )
    or (select public.staff_can_access_verification_case(verification_case_id))
  );

-- Preserve the exact 022 request validation, normalized equality comparison,
-- and customer-scoped key uniqueness. New requests begin private as drafts.
drop function if exists public.create_verification_case(text, text, text, boolean, text, text, text, text, boolean, uuid);
create function public.create_verification_case(
  p_site_description text, p_area_lga text, p_area_name text,
  p_area_is_listed boolean, p_address_line text, p_customer_notes text,
  p_contact_preference text, p_contact_phone text,
  p_contact_phone_consent boolean, p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  new_case_id uuid;
  existing_case public.verification_cases%rowtype;
  normalized_phone text;
  normalized_area_lga text := btrim(coalesce(p_area_lga, ''));
  normalized_notes text := nullif(btrim(coalesce(p_customer_notes, '')), '');
begin
  if actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  if p_idempotency_key is null then raise exception 'An idempotency key is required' using errcode = '22023'; end if;
  if char_length(btrim(coalesce(p_site_description, ''))) not between 10 and 2000 then raise exception 'Plot description must be between 10 and 2000 characters' using errcode = '22023'; end if;
  if normalized_area_lga not in ('AMAC', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Abaji') then raise exception 'Choose one of the six FCT area councils' using errcode = '22023'; end if;
  if char_length(btrim(coalesce(p_area_name, ''))) not between 2 and 120 then raise exception 'Enter an area name between 2 and 120 characters' using errcode = '22023'; end if;
  if p_area_is_listed is null then raise exception 'Choose whether the area is in the starter list' using errcode = '22023'; end if;
  if p_area_is_listed and not (
    (normalized_area_lga = 'AMAC' and btrim(p_area_name) in ('Asokoro', 'Apo', 'Garki', 'Jabi', 'Lugbe', 'Maitama', 'Utako', 'Wuse')) or
    (normalized_area_lga = 'Bwari' and btrim(p_area_name) in ('Bwari', 'Byazhin', 'Dutse', 'Kubwa', 'Kawu', 'Ushafa')) or
    (normalized_area_lga = 'Gwagwalada' and btrim(p_area_name) in ('Dobi', 'Gwagwalada', 'Gwako', 'Ibwa', 'Tungan Maje', 'Zuba')) or
    (normalized_area_lga = 'Kuje' and btrim(p_area_name) in ('Chibiri', 'Gaube', 'Kuje', 'Kwaku', 'Rubochi')) or
    (normalized_area_lga = 'Kwali' and btrim(p_area_name) in ('Dafa', 'Kundu', 'Pai', 'Wako', 'Yangoji', 'Kwali')) or
    (normalized_area_lga = 'Abaji' and btrim(p_area_name) in ('Abaji', 'Agyana', 'Nuku', 'Rimba', 'Yaba'))
  ) then raise exception 'Choose a listed area or mark it as unlisted' using errcode = '22023'; end if;
  if char_length(btrim(coalesce(p_address_line, ''))) not between 3 and 500 then raise exception 'Enter an address between 3 and 500 characters' using errcode = '22023'; end if;
  if char_length(coalesce(p_customer_notes, '')) > 4000 then raise exception 'Notes must not exceed 4000 characters' using errcode = '22023'; end if;
  if p_contact_preference is null or p_contact_preference not in ('email', 'phone', 'whatsapp') then raise exception 'Unsupported contact preference' using errcode = '22023'; end if;
  if p_contact_preference = 'email' then
    if nullif(btrim(coalesce(p_contact_phone, '')), '') is not null or coalesce(p_contact_phone_consent, false) then raise exception 'Phone details are only used when phone or WhatsApp is selected' using errcode = '22023'; end if;
    normalized_phone := null;
  else
    if not coalesce(p_contact_phone_consent, false) then raise exception 'Consent is required to use a phone number for this request' using errcode = '22023'; end if;
    normalized_phone := regexp_replace(btrim(coalesce(p_contact_phone, '')), '[[:space:]()-]', '', 'g');
    if normalized_phone ~ '^0[789][0-9]{9}$' then normalized_phone := '+234' || substr(normalized_phone, 2);
    elsif normalized_phone !~ '^[+]234[789][0-9]{9}$' then raise exception 'Enter a valid Nigerian mobile number' using errcode = '22023'; end if;
  end if;

  select * into existing_case from public.verification_cases
  where customer_user_id = actor_id and idempotency_key = p_idempotency_key;
  if found then
    if existing_case.site_description is distinct from btrim(p_site_description)
      or existing_case.area_lga is distinct from normalized_area_lga
      or existing_case.area_name is distinct from btrim(p_area_name)
      or existing_case.area_is_listed is distinct from p_area_is_listed
      or existing_case.address_line is distinct from btrim(p_address_line)
      or existing_case.customer_notes is distinct from normalized_notes
      or existing_case.contact_preference is distinct from p_contact_preference
      or existing_case.contact_phone is distinct from normalized_phone
      or existing_case.contact_phone_consent is distinct from coalesce(p_contact_phone_consent, false) then
      raise exception 'Idempotency key was already used with different request data' using errcode = '22023';
    end if;
    return existing_case.id;
  end if;

  insert into public.verification_cases (
    customer_user_id, created_by_user_id, site_description, area_lga, area_name,
    area_is_listed, address_line, customer_notes, contact_preference,
    contact_phone, contact_phone_consent, idempotency_key, workflow_status
  ) values (
    actor_id, actor_id, btrim(p_site_description), normalized_area_lga,
    btrim(p_area_name), p_area_is_listed, btrim(p_address_line), normalized_notes,
    p_contact_preference, normalized_phone, coalesce(p_contact_phone_consent, false),
    p_idempotency_key, 'draft'
  ) on conflict (customer_user_id, idempotency_key) where idempotency_key is not null
    do nothing returning id into new_case_id;

  if new_case_id is null then
    select * into existing_case from public.verification_cases
    where customer_user_id = actor_id and idempotency_key = p_idempotency_key;
    if not found then raise exception 'Could not resolve idempotent case creation' using errcode = '40001'; end if;
    if existing_case.site_description is distinct from btrim(p_site_description)
      or existing_case.area_lga is distinct from normalized_area_lga
      or existing_case.area_name is distinct from btrim(p_area_name)
      or existing_case.area_is_listed is distinct from p_area_is_listed
      or existing_case.address_line is distinct from btrim(p_address_line)
      or existing_case.customer_notes is distinct from normalized_notes
      or existing_case.contact_preference is distinct from p_contact_preference
      or existing_case.contact_phone is distinct from normalized_phone
      or existing_case.contact_phone_consent is distinct from coalesce(p_contact_phone_consent, false) then
      raise exception 'Idempotency key was already used with different request data' using errcode = '22023';
    end if;
    return existing_case.id;
  end if;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (actor_id, 'verification_case.draft_created', 'verification_case', new_case_id,
    jsonb_build_object('creation_channel', 'customer', 'jurisdiction', 'Abuja/FCT', 'is_demo_data', true));
  return new_case_id;
end;
$$;
revoke execute on function public.create_verification_case(text, text, text, boolean, text, text, text, text, boolean, uuid) from public, anon;
grant execute on function public.create_verification_case(text, text, text, boolean, text, text, text, text, boolean, uuid) to authenticated;

create or replace function public.submit_verification_case(p_case_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := (select auth.uid()); case_row public.verification_cases%rowtype;
begin
  if actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  select * into case_row from public.verification_cases where id = p_case_id for update;
  if not found then raise exception 'Verification case not found' using errcode = 'P0002'; end if;
  if case_row.customer_user_id <> actor_id then raise exception 'Only the case customer can submit' using errcode = '42501'; end if;
  if exists (
    select 1 from public.case_status_events e
    where e.verification_case_id = p_case_id
      and e.actor_user_id = actor_id
      and e.from_status = 'draft'
      and e.to_status = 'submitted'
      and e.event_kind = 'status_change'
      and e.reason = 'Request submitted by customer.'
  ) then return p_case_id; end if;
  if case_row.workflow_status <> 'draft' then raise exception 'Only a draft can be submitted' using errcode = '22023'; end if;
  update public.verification_cases set workflow_status = 'submitted' where id = p_case_id;
  insert into public.case_status_events(verification_case_id, actor_user_id, from_status, to_status, reason, customer_visible, event_kind)
  values(p_case_id, actor_id, 'draft', 'submitted', 'Request submitted by customer.', true, 'status_change');
  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  values(actor_id, 'verification_case.submitted', 'verification_case', p_case_id, '{}'::jsonb);
  return p_case_id;
end; $$;

create or replace function public.discard_draft_case(p_case_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := (select auth.uid()); case_row public.verification_cases%rowtype;
begin
  if actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  select * into case_row from public.verification_cases where id = p_case_id for update;
  if not found then raise exception 'Verification case not found' using errcode = 'P0002'; end if;
  if case_row.customer_user_id <> actor_id then raise exception 'Only the case customer can discard this draft' using errcode = '42501'; end if;
  if case_row.workflow_status <> 'draft' then raise exception 'Only a draft can be discarded' using errcode = '22023'; end if;
  update public.verification_cases
  set workflow_status = 'cancelled', discarded_at = now()
  where id = p_case_id;
  insert into public.case_status_events(verification_case_id, actor_user_id, from_status, to_status, reason, customer_visible, event_kind)
  values(p_case_id, actor_id, 'draft', 'cancelled', 'This draft was discarded.', true, 'status_change');
  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  values(actor_id, 'verification_case.draft_discarded', 'verification_case', p_case_id, '{}'::jsonb);
  return p_case_id;
end; $$;

create or replace function public.cancel_verification_case(p_case_id uuid, p_reason text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := (select auth.uid()); case_row public.verification_cases%rowtype;
begin
  if actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  if char_length(coalesce(p_reason, '')) > 2000 then raise exception 'Reason must not exceed 2000 characters' using errcode = '22023'; end if;
  select * into case_row from public.verification_cases where id = p_case_id for update;
  if not found then raise exception 'Verification case not found' using errcode = 'P0002'; end if;
  if case_row.customer_user_id <> actor_id then raise exception 'Only the case customer can cancel' using errcode = '42501'; end if;
  if case_row.workflow_status not in ('submitted', 'assigned', 'in_review', 'needs_customer_info') then
    raise exception 'This case cannot be cancelled by the customer' using errcode = '22023';
  end if;
  update public.verification_cases set workflow_status = 'cancelled' where id = p_case_id;
  update public.case_assignments set status = 'cancelled'
  where verification_case_id = p_case_id and status = 'active';
  insert into public.case_status_events(verification_case_id, actor_user_id, from_status, to_status, reason, customer_visible, event_kind)
  values(p_case_id, actor_id, case_row.workflow_status, 'cancelled', 'You cancelled this request.', true, 'status_change');
  insert into public.case_status_events(verification_case_id, actor_user_id, from_status, to_status, reason, customer_visible, event_kind)
  values(p_case_id, actor_id, case_row.workflow_status, 'cancelled', coalesce(nullif(btrim(coalesce(p_reason, '')), ''), 'No reason given'), false, 'staff_note');
  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  values(actor_id, 'verification_case.cancelled_by_customer', 'verification_case', p_case_id, '{}'::jsonb);
  return p_case_id;
end; $$;

-- Evidence registration keeps the same validations and path/version/quota rules,
-- with draft added as the only new eligible state. The case row remains locked.
create or replace function public.register_case_evidence(
  p_evidence_id uuid, p_case_id uuid, p_evidence_type text, p_description text,
  p_storage_path text, p_original_filename text, p_mime_type text,
  p_size_bytes bigint, p_supersedes_evidence_id uuid default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := (select auth.uid()); case_row public.verification_cases%rowtype;
  predecessor public.case_evidence%rowtype; next_version integer := 1; evidence_label text;
begin
  if actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  select * into case_row from public.verification_cases where id = p_case_id for update;
  if not found then raise exception 'Verification case not found' using errcode = 'P0002'; end if;
  if case_row.customer_user_id <> actor_id then raise exception 'Only the case customer can add evidence' using errcode = '42501'; end if;
  if case_row.workflow_status not in ('draft', 'submitted', 'assigned', 'in_review', 'needs_customer_info') then raise exception 'This case is not accepting evidence' using errcode = '22023'; end if;
  if p_evidence_type not in ('title_deed_copy', 'survey_plan_copy', 'receipt', 'seller_id', 'other') then raise exception 'Unsupported evidence type' using errcode = '22023'; end if;
  if char_length(btrim(coalesce(p_description, ''))) not between 2 and 500 then raise exception 'Description must be between 2 and 500 characters' using errcode = '22023'; end if;
  if p_mime_type not in ('application/pdf', 'image/jpeg', 'image/png') then raise exception 'Unsupported file type' using errcode = '22023'; end if;
  if p_size_bytes <= 0 or p_size_bytes > 10485760 then raise exception 'File must be no larger than 10 MB' using errcode = '22023'; end if;
  if char_length(btrim(coalesce(p_original_filename, ''))) not between 1 and 255 then raise exception 'Invalid original filename' using errcode = '22023'; end if;
  if public.document_case_id_from_path(p_storage_path) is distinct from p_case_id or public.document_evidence_id_from_path(p_storage_path) is distinct from p_evidence_id then raise exception 'Invalid evidence storage path' using errcode = '22023'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'documents' and name = p_storage_path) then raise exception 'Evidence object was not uploaded' using errcode = '22023'; end if;
  if (select count(*) from public.case_evidence where verification_case_id = p_case_id) >= 10 then raise exception 'A case can have at most 10 files' using errcode = '22023'; end if;
  if p_supersedes_evidence_id is not null then
    select * into predecessor from public.case_evidence where id = p_supersedes_evidence_id and verification_case_id = p_case_id;
    if not found then raise exception 'Superseded evidence must belong to this case' using errcode = '22023'; end if;
    if predecessor.evidence_type <> p_evidence_type then raise exception 'A replacement must keep the same evidence type' using errcode = '22023'; end if;
    next_version := predecessor.version + 1;
  end if;
  insert into public.case_evidence(id, verification_case_id, uploaded_by_user_id, evidence_type, description, storage_path, original_filename, mime_type, size_bytes, version, supersedes_evidence_id)
  values(p_evidence_id, p_case_id, actor_id, p_evidence_type, btrim(p_description), p_storage_path, btrim(p_original_filename), p_mime_type, p_size_bytes, next_version, p_supersedes_evidence_id);
  evidence_label := case p_evidence_type when 'title_deed_copy' then 'Title deed copy' when 'survey_plan_copy' then 'Survey plan copy' when 'receipt' then 'Receipt' when 'seller_id' then 'ID of seller' else 'Other' end;
  insert into public.case_status_events(verification_case_id, actor_user_id, from_status, to_status, reason, customer_visible, event_kind)
  values(p_case_id, actor_id, case_row.workflow_status, case_row.workflow_status, 'Document added: ' || evidence_label, true, 'status_change');
  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  values(actor_id, 'case_evidence.created', 'case_evidence', p_evidence_id,
    jsonb_build_object('verification_case_id', p_case_id, 'evidence_type', p_evidence_type, 'version', next_version, 'source', 'customer_supplied', 'is_demo_data', true));
  return p_evidence_id;
end; $$;

-- Storage insert permits the owner's draft while all object-read policies stay
-- absent. The bucket, path convention, MIME/size checks and file limit are unchanged.
drop policy if exists "Customers can upload evidence for their cases" on storage.objects;
create policy "Customers can upload evidence for their cases" on storage.objects for insert to authenticated
with check (
  bucket_id = 'documents'
  and public.document_case_id_from_path(name) is not null
  and exists (
    select 1 from public.verification_cases vc
    where vc.id = public.document_case_id_from_path(name)
      and vc.customer_user_id = (select auth.uid())
      and vc.workflow_status in ('draft', 'submitted', 'assigned', 'in_review', 'needs_customer_info')
      and (select count(*) from public.case_evidence ce where ce.verification_case_id = vc.id) < 10
  )
);

create or replace function public.authorize_case_evidence_download(p_evidence_id uuid)
returns table(storage_path text, original_filename text)
language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := (select auth.uid()); evidence_row public.case_evidence%rowtype;
begin
  if actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  select * into evidence_row from public.case_evidence where id = p_evidence_id;
  if not found then raise exception 'Evidence not found' using errcode = 'P0002'; end if;
  if not public.staff_can_access_verification_case(evidence_row.verification_case_id) then raise exception 'Staff access to this case is required' using errcode = '42501'; end if;
  if exists (select 1 from public.verification_cases vc where vc.id = evidence_row.verification_case_id and vc.workflow_status = 'draft') then
    raise exception 'Staff access to draft evidence is denied' using errcode = '42501';
  end if;
  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  values(actor_id, 'document.accessed', 'case_evidence', evidence_row.id, jsonb_build_object('verification_case_id', evidence_row.verification_case_id));
  return query select evidence_row.storage_path, evidence_row.original_filename;
end; $$;

revoke execute on function public.submit_verification_case(uuid) from public, anon;
revoke execute on function public.discard_draft_case(uuid) from public, anon;
revoke execute on function public.cancel_verification_case(uuid, text) from public, anon;
revoke execute on function public.register_case_evidence(uuid, uuid, text, text, text, text, text, bigint, uuid) from public, anon;
revoke execute on function public.authorize_case_evidence_download(uuid) from public, anon;
grant execute on function public.submit_verification_case(uuid) to authenticated;
grant execute on function public.discard_draft_case(uuid) to authenticated;
grant execute on function public.cancel_verification_case(uuid, text) to authenticated;
grant execute on function public.register_case_evidence(uuid, uuid, text, text, text, text, text, bigint, uuid) to authenticated;
grant execute on function public.authorize_case_evidence_download(uuid) to authenticated;
