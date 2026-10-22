-- Add structured FCT locations and case-scoped customer contact details.
-- Replace assignment note visibility with a fixed customer event plus a private note.
-- STARTER_AREAS_VERSION: 2026-10-22 (keep aligned with abuja-locations.ts)

alter table public.verification_cases
  add column area_name text,
  add column area_is_listed boolean,
  add column address_line text,
  add column contact_phone text,
  add column contact_phone_consent boolean not null default false;

-- Legacy rows may contain this older council label. Normalize before adding the check;
-- NOT VALID skips the initial scan, but still checks later updates to old rows.
update public.verification_cases
set area_lga = 'Kwali'
where area_lga = 'Kwali LGA';

alter table public.verification_cases
  add constraint verification_cases_area_lga_fct_council_check
  check (area_lga in ('AMAC', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Abaji'))
  not valid;

drop function if exists public.assign_verification_case(uuid, uuid, text, boolean);

create function public.assign_verification_case(
  p_case_id uuid,
  p_assignee_user_id uuid,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  case_row public.verification_cases%rowtype;
  assignment_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_note, ''))) not between 2 and 2000 then
    raise exception 'An assignment note is required' using errcode = '22023';
  end if;

  select * into case_row
  from public.verification_cases
  where id = p_case_id
  for update;

  if not found then
    raise exception 'Verification case not found' using errcode = 'P0002';
  end if;
  if actor_id = case_row.customer_user_id then
    raise exception 'Case customer cannot assign their own case' using errcode = '42501';
  end if;
  if p_assignee_user_id = case_row.customer_user_id then
    raise exception 'Case customer cannot be assigned to their own case' using errcode = '42501';
  end if;
  if not public.is_department_lead(case_row.department) then
    raise exception 'An active lead in the case department must assign this case' using errcode = '42501';
  end if;
  if case_row.workflow_status <> 'submitted' then
    raise exception 'Only submitted cases can be assigned' using errcode = '22023';
  end if;
  if not exists (
    select 1
    from public.staff_members
    where user_id = p_assignee_user_id
      and department = case_row.department
      and active
  ) then
    raise exception 'Assignee must be active in the case department' using errcode = '42501';
  end if;

  insert into public.case_assignments (
    verification_case_id,
    assignee_user_id,
    assigned_by_user_id,
    status
  )
  values (p_case_id, p_assignee_user_id, actor_id, 'active')
  returning id into assignment_id;

  update public.verification_cases
  set workflow_status = 'assigned',
      assigned_lead_user_id = actor_id
  where id = p_case_id;

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
    'submitted',
    'assigned',
    'A reviewer has been assigned to your case.',
    true,
    'status_change'
  );

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
    'submitted',
    'assigned',
    btrim(p_note),
    false,
    'staff_note'
  );

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    actor_id,
    'verification_case.assigned',
    'verification_case',
    p_case_id,
    jsonb_build_object('assignment_id', assignment_id, 'assignee_user_id', p_assignee_user_id)
  );

  return assignment_id;
end;
$$;

revoke execute on function public.assign_verification_case(uuid, uuid, text)
  from public, anon;
grant execute on function public.assign_verification_case(uuid, uuid, text)
  to authenticated;

drop function if exists public.create_verification_case(text, text, text, text, uuid);

create function public.create_verification_case(
  p_site_description text,
  p_area_lga text,
  p_area_name text,
  p_area_is_listed boolean,
  p_address_line text,
  p_customer_notes text,
  p_contact_preference text,
  p_contact_phone text,
  p_contact_phone_consent boolean,
  p_idempotency_key uuid
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
  if actor_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;
  if p_idempotency_key is null then
    raise exception 'An idempotency key is required' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_site_description, ''))) not between 10 and 2000 then
    raise exception 'Plot description must be between 10 and 2000 characters' using errcode = '22023';
  end if;
  if normalized_area_lga not in ('AMAC', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Abaji') then
    raise exception 'Choose one of the six FCT area councils' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_area_name, ''))) not between 2 and 120 then
    raise exception 'Enter an area name between 2 and 120 characters' using errcode = '22023';
  end if;
  if p_area_is_listed is null then
    raise exception 'Choose whether the area is in the starter list' using errcode = '22023';
  end if;
  if p_area_is_listed and not (
    (normalized_area_lga = 'AMAC' and btrim(p_area_name) in ('Asokoro', 'Apo', 'Garki', 'Jabi', 'Lugbe', 'Maitama', 'Utako', 'Wuse')) or
    (normalized_area_lga = 'Bwari' and btrim(p_area_name) in ('Bwari', 'Byazhin', 'Dutse', 'Kubwa', 'Kawu', 'Ushafa')) or
    (normalized_area_lga = 'Gwagwalada' and btrim(p_area_name) in ('Dobi', 'Gwagwalada', 'Gwako', 'Ibwa', 'Tungan Maje', 'Zuba')) or
    (normalized_area_lga = 'Kuje' and btrim(p_area_name) in ('Chibiri', 'Gaube', 'Kuje', 'Kwaku', 'Rubochi')) or
    (normalized_area_lga = 'Kwali' and btrim(p_area_name) in ('Dafa', 'Kundu', 'Pai', 'Wako', 'Yangoji', 'Kwali')) or
    (normalized_area_lga = 'Abaji' and btrim(p_area_name) in ('Abaji', 'Agyana', 'Nuku', 'Rimba', 'Yaba'))
  ) then
    raise exception 'Choose a listed area or mark it as unlisted' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_address_line, ''))) not between 3 and 500 then
    raise exception 'Enter an address between 3 and 500 characters' using errcode = '22023';
  end if;
  if char_length(coalesce(p_customer_notes, '')) > 4000 then
    raise exception 'Notes must not exceed 4000 characters' using errcode = '22023';
  end if;
  if p_contact_preference is null or p_contact_preference not in ('email', 'phone', 'whatsapp') then
    raise exception 'Unsupported contact preference' using errcode = '22023';
  end if;

  if p_contact_preference = 'email' then
    if nullif(btrim(coalesce(p_contact_phone, '')), '') is not null
      or coalesce(p_contact_phone_consent, false) then
      raise exception 'Phone details are only used when phone or WhatsApp is selected' using errcode = '22023';
    end if;
    normalized_phone := null;
  else
    if not coalesce(p_contact_phone_consent, false) then
      raise exception 'Consent is required to use a phone number for this request' using errcode = '22023';
    end if;
    normalized_phone := regexp_replace(btrim(coalesce(p_contact_phone, '')), '[[:space:]()-]', '', 'g');
    if normalized_phone ~ '^0[789][0-9]{9}$' then
      normalized_phone := '+234' || substr(normalized_phone, 2);
    elsif normalized_phone !~ '^[+]234[789][0-9]{9}$' then
      raise exception 'Enter a valid Nigerian mobile number' using errcode = '22023';
    end if;
  end if;

  select * into existing_case
  from public.verification_cases
  where customer_user_id = actor_id
    and idempotency_key = p_idempotency_key;

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
      raise exception 'Idempotency key was already used with different request data'
        using errcode = '22023';
    end if;

    return existing_case.id;
  end if;

  insert into public.verification_cases (
    customer_user_id,
    created_by_user_id,
    site_description,
    area_lga,
    area_name,
    area_is_listed,
    address_line,
    customer_notes,
    contact_preference,
    contact_phone,
    contact_phone_consent,
    idempotency_key
  ) values (
    actor_id,
    actor_id,
    btrim(p_site_description),
    normalized_area_lga,
    btrim(p_area_name),
    p_area_is_listed,
    btrim(p_address_line),
    normalized_notes,
    p_contact_preference,
    normalized_phone,
    coalesce(p_contact_phone_consent, false),
    p_idempotency_key
  )
  on conflict (customer_user_id, idempotency_key)
    where idempotency_key is not null
    do nothing
  returning id into new_case_id;

  if new_case_id is null then
    select * into existing_case
    from public.verification_cases
    where customer_user_id = actor_id
      and idempotency_key = p_idempotency_key;

    if not found then
      raise exception 'Could not resolve idempotent case creation' using errcode = '40001';
    end if;

    if existing_case.site_description is distinct from btrim(p_site_description)
      or existing_case.area_lga is distinct from normalized_area_lga
      or existing_case.area_name is distinct from btrim(p_area_name)
      or existing_case.area_is_listed is distinct from p_area_is_listed
      or existing_case.address_line is distinct from btrim(p_address_line)
      or existing_case.customer_notes is distinct from normalized_notes
      or existing_case.contact_preference is distinct from p_contact_preference
      or existing_case.contact_phone is distinct from normalized_phone
      or existing_case.contact_phone_consent is distinct from coalesce(p_contact_phone_consent, false) then
      raise exception 'Idempotency key was already used with different request data'
        using errcode = '22023';
    end if;

    return existing_case.id;
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
    new_case_id,
    actor_id,
    null,
    'submitted',
    'Request submitted by customer.',
    true,
    'status_change'
  );

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    actor_id,
    'verification_case.created',
    'verification_case',
    new_case_id,
    jsonb_build_object('creation_channel', 'customer', 'jurisdiction', 'Abuja/FCT', 'is_demo_data', true)
  );

  return new_case_id;
end;
$$;

revoke execute on function public.create_verification_case(
  text, text, text, boolean, text, text, text, text, boolean, uuid
) from public, anon;
grant execute on function public.create_verification_case(
  text, text, text, boolean, text, text, text, text, boolean, uuid
) to authenticated;
