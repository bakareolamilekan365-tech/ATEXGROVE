-- Phase 2, Slice 1 hardening: separate customer-safe status updates from
-- internal staff notes. This forward migration does not alter historical events.

drop function if exists public.transition_verification_case(uuid, text, text, boolean);

create function public.transition_verification_case(
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
    customer_visible
  ) values (
    p_case_id,
    actor_id,
    case_row.workflow_status,
    p_to_status,
    customer_status_reason,
    true
  ) returning id into customer_status_event_id;

  insert into public.case_status_events (
    verification_case_id,
    actor_user_id,
    from_status,
    to_status,
    reason,
    customer_visible
  ) values (
    p_case_id,
    actor_id,
    case_row.workflow_status,
    p_to_status,
    btrim(p_staff_note),
    false
  ) returning id into staff_note_event_id;

  if clean_customer_message <> '' then
    insert into public.case_status_events (
      verification_case_id,
      actor_user_id,
      from_status,
      to_status,
      reason,
      customer_visible
    ) values (
      p_case_id,
      actor_id,
      case_row.workflow_status,
      p_to_status,
      clean_customer_message,
      true
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

revoke execute on function public.transition_verification_case(uuid, text, text, text) from public, anon;
grant execute on function public.transition_verification_case(uuid, text, text, text) to authenticated;
