-- Make customer-created verification cases idempotent and distinguish timeline
-- event semantics. Historical migrations 001-020 remain unchanged.

alter table public.verification_cases
  add column idempotency_key uuid;

create unique index verification_cases_customer_idempotency_key_idx
  on public.verification_cases (customer_user_id, idempotency_key)
  where idempotency_key is not null;

alter table public.case_status_events
  add column event_kind text not null default 'status_change';

-- Classify historical events without changing their text or visibility.
update public.case_status_events as event
set event_kind = case
  when not event.customer_visible then 'staff_note'
  when event.from_status = 'needs_customer_info'
    and event.to_status = 'in_review'
    and event.actor_user_id = verification_case.customer_user_id
    then 'customer_response'
  when event.to_status = 'needs_customer_info' then 'information_requested'
  when event.reason in (
    'Request submitted by customer.',
    'Your case is now in review.',
    'This case was closed. No verification result was issued.',
    'This case was cancelled.'
  ) then 'status_change'
  else 'customer_message'
end
from public.verification_cases as verification_case
where verification_case.id = event.verification_case_id;

alter table public.case_status_events
  add constraint case_status_events_event_kind_check
  check (event_kind in (
    'status_change',
    'staff_note',
    'customer_message',
    'information_requested',
    'customer_response'
  ));

drop function if exists public.create_verification_case(text, text, text, text);

create function public.create_verification_case(
  p_site_description text,
  p_area_lga text,
  p_customer_notes text,
  p_contact_preference text,
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
begin
  if actor_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;
  if p_idempotency_key is null then
    raise exception 'An idempotency key is required' using errcode = '22023';
  end if;

  select id into new_case_id
  from public.verification_cases
  where customer_user_id = actor_id
    and idempotency_key = p_idempotency_key;

  if found then
    return new_case_id;
  end if;

  if char_length(btrim(coalesce(p_site_description, ''))) not between 10 and 2000 then
    raise exception 'Plot description must be between 10 and 2000 characters' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_area_lga, ''))) not between 2 and 120 then
    raise exception 'Area/LGA must be between 2 and 120 characters' using errcode = '22023';
  end if;
  if p_contact_preference not in ('email', 'phone', 'whatsapp') then
    raise exception 'Unsupported contact preference' using errcode = '22023';
  end if;
  if char_length(coalesce(p_customer_notes, '')) > 4000 then
    raise exception 'Notes must not exceed 4000 characters' using errcode = '22023';
  end if;

  insert into public.verification_cases (
    customer_user_id,
    created_by_user_id,
    site_description,
    area_lga,
    customer_notes,
    contact_preference,
    idempotency_key
  )
  values (
    actor_id,
    actor_id,
    btrim(p_site_description),
    btrim(p_area_lga),
    nullif(btrim(coalesce(p_customer_notes, '')), ''),
    p_contact_preference,
    p_idempotency_key
  )
  on conflict (customer_user_id, idempotency_key)
    where idempotency_key is not null
    do nothing
  returning id into new_case_id;

  if new_case_id is null then
    select id into new_case_id
    from public.verification_cases
    where customer_user_id = actor_id
      and idempotency_key = p_idempotency_key;

    if not found then
      raise exception 'Could not resolve idempotent case creation' using errcode = '40001';
    end if;

    return new_case_id;
  end if;

  insert into public.case_status_events (
    verification_case_id,
    actor_user_id,
    from_status,
    to_status,
    reason,
    customer_visible,
    event_kind
  )
  values (
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

revoke execute on function public.create_verification_case(text, text, text, text, uuid)
  from public, anon;
grant execute on function public.create_verification_case(text, text, text, text, uuid)
  to authenticated;

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
    or (case_row.workflow_status = 'needs_customer_info' and p_to_status = 'in_review')
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

revoke execute on function public.transition_verification_case(uuid, text, text, text)
  from public, anon;
grant execute on function public.transition_verification_case(uuid, text, text, text)
  to authenticated;

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
    'needs_customer_info',
    'in_review',
    'Customer provided the requested information.',
    true,
    'customer_response'
  ) returning id into status_event_id;

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
    'needs_customer_info',
    'in_review',
    btrim(p_message),
    true,
    'customer_response'
  ) returning id into response_event_id;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    actor_id,
    'verification_case.customer_responded',
    'verification_case',
    p_case_id,
    jsonb_build_object(
      'status_event_id', status_event_id,
      'response_event_id', response_event_id
    )
  );

  return response_event_id;
end;
$$;

revoke execute on function public.customer_respond_to_case(uuid, text)
  from public, anon;
grant execute on function public.customer_respond_to_case(uuid, text)
  to authenticated;
