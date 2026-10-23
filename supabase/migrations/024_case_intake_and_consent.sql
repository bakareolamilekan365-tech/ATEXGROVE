-- Customer intake claims, case references, and recorded service-scope consent.
-- Forward-only: migrations 001-023 are historical and remain unchanged.

alter table public.verification_cases
  add column customer_intent text,
  add column relationship_to_land text,
  add column acting_for text,
  add column principal_name text,
  add column authority_confirmed boolean,
  add column case_number text;

alter table public.verification_cases
  add constraint verification_cases_customer_intent_check
    check (customer_intent is null or customer_intent in ('buying', 'own_or_occupy', 'developing', 'representing_someone', 'other')),
  add constraint verification_cases_relationship_to_land_check
    check (relationship_to_land is null or relationship_to_land in ('buyer', 'owner', 'occupier', 'developer', 'agent_or_representative', 'other')),
  add constraint verification_cases_acting_for_check
    check (acting_for is null or acting_for in ('self', 'another_person', 'organisation')),
  add constraint verification_cases_principal_name_check
    check (principal_name is null or (char_length(btrim(principal_name)) between 1 and 200)),
  add constraint verification_cases_authority_check
    check (coalesce((
      (acting_for is null and principal_name is null and authority_confirmed is null)
      or (acting_for = 'self' and principal_name is null and authority_confirmed is null)
      or (acting_for in ('another_person', 'organisation') and principal_name is not null and authority_confirmed = true)
    ), false));

create unique index verification_cases_case_number_key
  on public.verification_cases(case_number) where case_number is not null;

create sequence public.verification_case_number_seq start with 1 increment by 1;
revoke all on sequence public.verification_case_number_seq from public, anon, authenticated, service_role;

-- Backfill only submitted-or-later cases. Existing draft and new intake claims
-- remain NULL; legacy claims are never inferred from old free-text fields.
with numbered as (
  select id, created_at,
    row_number() over (order by created_at, id) as serial
  from public.verification_cases
  where workflow_status in ('submitted', 'assigned', 'in_review', 'needs_customer_info', 'closed', 'cancelled')
    and discarded_at is null
)
update public.verification_cases vc
set case_number = 'ATX-LV-' || extract(year from numbered.created_at)::integer::text || '-' || lpad(numbered.serial::text, 6, '0')
from numbered
where vc.id = numbered.id;

select setval(
  'public.verification_case_number_seq',
  greatest(1, (select count(*) from public.verification_cases where case_number is not null)),
  exists (select 1 from public.verification_cases where case_number is not null)
);

create table public.case_consents (
  id uuid primary key default gen_random_uuid(),
  verification_case_id uuid not null references public.verification_cases(id) on delete restrict,
  customer_user_id uuid not null references auth.users(id) on delete restrict,
  consent_type text not null check (consent_type = 'case_service_scope'),
  notice_version text not null check (char_length(btrim(notice_version)) between 1 and 80),
  accepted_at timestamptz not null default now(),
  constraint case_consents_case_type_key unique (verification_case_id, consent_type)
);

alter table public.case_consents enable row level security;
create policy "Customers and scoped staff can read case consents"
  on public.case_consents for select to authenticated
  using (
    customer_user_id = (select auth.uid())
    or (select public.staff_can_access_verification_case(verification_case_id))
  );
revoke all on public.case_consents from public, anon, authenticated;
grant select on public.case_consents to authenticated;
revoke all on public.case_consents from service_role;
grant select on public.case_consents to service_role;

-- Replace the ten-argument 023 signature. The idempotency equality check now
-- includes every newly collected claim as well as all existing request fields.
drop function public.create_verification_case(text, text, text, boolean, text, text, text, text, boolean, uuid);
create function public.create_verification_case(
  p_site_description text, p_area_lga text, p_area_name text,
  p_area_is_listed boolean, p_address_line text, p_customer_notes text,
  p_contact_preference text, p_contact_phone text,
  p_contact_phone_consent boolean, p_idempotency_key uuid,
  p_customer_intent text, p_relationship_to_land text,
  p_acting_for text, p_principal_name text, p_authority_confirmed boolean
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
  normalized_principal text := nullif(btrim(coalesce(p_principal_name, '')), '');
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
  if p_customer_intent is null or p_customer_intent not in ('buying', 'own_or_occupy', 'developing', 'representing_someone', 'other') then raise exception 'Choose a valid reason for this request' using errcode = '22023'; end if;
  if p_relationship_to_land is null or p_relationship_to_land not in ('buyer', 'owner', 'occupier', 'developer', 'agent_or_representative', 'other') then raise exception 'Choose your relationship to the land' using errcode = '22023'; end if;
  if p_acting_for is null or p_acting_for not in ('self', 'another_person', 'organisation') then raise exception 'Choose who this request is for' using errcode = '22023'; end if;
  if p_acting_for = 'self' then
    if normalized_principal is not null or coalesce(p_authority_confirmed, false) then raise exception 'For a request for yourself, principal details and authority confirmation must be empty' using errcode = '22023'; end if;
    normalized_principal := null;
  else
    if normalized_principal is null or char_length(normalized_principal) > 200 then raise exception 'Enter the name of the person or organisation (up to 200 characters)' using errcode = '22023'; end if;
    if p_authority_confirmed is distinct from true then raise exception 'Confirm that you are authorised to submit this request on their behalf' using errcode = '22023'; end if;
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
      or existing_case.contact_phone_consent is distinct from coalesce(p_contact_phone_consent, false)
      or existing_case.customer_intent is distinct from p_customer_intent
      or existing_case.relationship_to_land is distinct from p_relationship_to_land
      or existing_case.acting_for is distinct from p_acting_for
      or existing_case.principal_name is distinct from normalized_principal
      or existing_case.authority_confirmed is distinct from (case when p_acting_for = 'self' then null else p_authority_confirmed end) then
      raise exception 'Idempotency key was already used with different request data' using errcode = '22023';
    end if;
    return existing_case.id;
  end if;

  insert into public.verification_cases (
    customer_user_id, created_by_user_id, site_description, area_lga, area_name,
    area_is_listed, address_line, customer_notes, contact_preference,
    contact_phone, contact_phone_consent, idempotency_key, workflow_status,
    customer_intent, relationship_to_land, acting_for, principal_name, authority_confirmed
  ) values (
    actor_id, actor_id, btrim(p_site_description), normalized_area_lga,
    btrim(p_area_name), p_area_is_listed, btrim(p_address_line), normalized_notes,
    p_contact_preference, normalized_phone, coalesce(p_contact_phone_consent, false),
    p_idempotency_key, 'draft', p_customer_intent, p_relationship_to_land,
    p_acting_for, normalized_principal, case when p_acting_for = 'self' then null else p_authority_confirmed end
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
      or existing_case.contact_phone_consent is distinct from coalesce(p_contact_phone_consent, false)
      or existing_case.customer_intent is distinct from p_customer_intent
      or existing_case.relationship_to_land is distinct from p_relationship_to_land
      or existing_case.acting_for is distinct from p_acting_for
      or existing_case.principal_name is distinct from normalized_principal
      or existing_case.authority_confirmed is distinct from (case when p_acting_for = 'self' then null else p_authority_confirmed end) then
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
revoke execute on function public.create_verification_case(text, text, text, boolean, text, text, text, text, boolean, uuid, text, text, text, text, boolean) from public, anon;
grant execute on function public.create_verification_case(text, text, text, boolean, text, text, text, text, boolean, uuid, text, text, text, text, boolean) to authenticated;

drop function public.submit_verification_case(uuid);
create function public.submit_verification_case(p_case_id uuid, p_notice_version text, p_accepted boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  case_row public.verification_cases%rowtype;
  next_number bigint;
  selected_version constant text := 'case-service-scope-v1';
begin
  if actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  if p_accepted is distinct from true then raise exception 'Service scope acceptance is required' using errcode = '22023'; end if;
  if p_notice_version is distinct from selected_version then raise exception 'The service notice has changed; review and accept the current notice' using errcode = '22023'; end if;
  select * into case_row from public.verification_cases where id = p_case_id for update;
  if not found then raise exception 'Verification case not found' using errcode = 'P0002'; end if;
  if case_row.customer_user_id <> actor_id then raise exception 'Only the case customer can submit' using errcode = '42501'; end if;
  if case_row.workflow_status not in ('draft', 'submitted') then raise exception 'Only a draft can be submitted' using errcode = '22023'; end if;

  insert into public.case_consents(verification_case_id, customer_user_id, consent_type, notice_version)
  values(p_case_id, actor_id, 'case_service_scope', selected_version)
  on conflict (verification_case_id, consent_type) do nothing;

  if case_row.workflow_status = 'submitted' then
    if case_row.case_number is null then
      next_number := nextval('public.verification_case_number_seq');
      if next_number > 999999 then raise exception 'Annual case number capacity exhausted' using errcode = '54000'; end if;
      update public.verification_cases
      set case_number = 'ATX-LV-' || extract(year from case_row.created_at)::integer::text || '-' || lpad(next_number::text, 6, '0')
      where id = p_case_id;
    end if;
    return p_case_id;
  end if;

  next_number := nextval('public.verification_case_number_seq');
  if next_number > 999999 then raise exception 'Annual case number capacity exhausted' using errcode = '54000'; end if;
  update public.verification_cases
  set workflow_status = 'submitted',
      case_number = 'ATX-LV-' || extract(year from now())::integer::text || '-' || lpad(next_number::text, 6, '0')
  where id = p_case_id;
  insert into public.case_status_events(verification_case_id, actor_user_id, from_status, to_status, reason, customer_visible, event_kind)
  values(p_case_id, actor_id, 'draft', 'submitted', 'Request submitted by customer.', true, 'status_change');
  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  values(actor_id, 'verification_case.submitted', 'verification_case', p_case_id, '{}'::jsonb);
  return p_case_id;
end;
$$;
revoke execute on function public.submit_verification_case(uuid, text, boolean) from public, anon;
grant execute on function public.submit_verification_case(uuid, text, boolean) to authenticated;
