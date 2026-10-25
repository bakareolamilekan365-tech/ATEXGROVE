-- Behavioural allow/deny tests for Phase 2, Slice 1.
-- Runs only against the disposable local/CI Supabase database.
begin;
select plan(61);

select ok((select relrowsecurity from pg_class where oid = 'public.staff_members'::regclass), 'staff_members has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.verification_cases'::regclass), 'verification_cases has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.case_assignments'::regclass), 'case_assignments has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.case_status_events'::regclass), 'case_status_events has RLS enabled');

select ok(not has_function_privilege('anon', 'public.organization_actor_role(uuid)', 'EXECUTE'), 'organization_actor_role is not callable by anon');
select ok(not has_function_privilege('anon', 'public.is_active_staff()', 'EXECUTE'), 'is_active_staff is not callable by anon');
select ok(not has_function_privilege('anon', 'public.is_department_lead(text)', 'EXECUTE'), 'is_department_lead is not callable by anon');
select ok(not has_function_privilege('anon', 'public.staff_can_access_verification_case(uuid)', 'EXECUTE'), 'case access helper is not callable by anon');
select ok(not has_function_privilege('anon', 'public.create_verification_case(text,text,text,boolean,text,text,text,text,boolean,uuid,text,text,text,text,boolean)', 'EXECUTE'), 'case creation RPC is not callable by anon');
select ok(not has_function_privilege('anon', 'public.assign_verification_case(uuid,uuid,text)', 'EXECUTE'), 'assignment RPC is not callable by anon');
select ok(not has_function_privilege('anon', 'public.transition_verification_case(uuid,text,text,text)', 'EXECUTE'), 'transition RPC is not callable by anon');

insert into auth.users (id, aud, role, email, raw_user_meta_data) values
  ('a1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'case-customer-a@test.invalid', '{}'),
  ('b2000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'case-customer-b@test.invalid', '{}'),
  ('c3000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'verification-lead@test.invalid', '{}'),
  ('d4000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'verification-assignee@test.invalid', '{}'),
  ('e5000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'operations-lead@test.invalid', '{}');

insert into public.staff_members (user_id, department, is_lead, active) values
  ('c3000000-0000-0000-0000-000000000003', 'Verification', true, true),
  ('d4000000-0000-0000-0000-000000000004', 'Verification', false, true),
  ('e5000000-0000-0000-0000-000000000005', 'Operations', true, true);

create temporary table slice_1_case_ids (id uuid primary key);
grant select, insert on table pg_temp.slice_1_case_ids to authenticated;
grant select on table pg_temp.slice_1_case_ids to anon;

select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$insert into pg_temp.slice_1_case_ids
    select public.create_verification_case(
      'DEMO DATA / NOT OFFICIAL plot near Kuje town centre',
      'Kuje',
      'Kuje', true, 'Near Kuje town centre',
      'Synthetic pilot request only.',
      'email',
      null, false,
      'a1111111-1111-4111-8111-111111111111',
      'buying', 'buyer', 'self', null, false
    )$$,
  'customer can create a verification case as a draft through the RPC'
);
select public.submit_verification_case((select id from pg_temp.slice_1_case_ids),'case-service-scope-v1',true);
reset role;

select is(
  (select workflow_status from public.verification_cases where id = (select id from pg_temp.slice_1_case_ids)),
  'submitted',
  'submitted draft is now submitted'
);
select is(
  (select area_is_listed from public.verification_cases where id = (select id from pg_temp.slice_1_case_ids)),
  true,
  'new listed-area case records true rather than a legacy null'
);
select is(
  (select count(*)::int from public.case_status_events where verification_case_id = (select id from pg_temp.slice_1_case_ids)),
  1,
  'request submission records its customer-safe status event atomically'
);

select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.verification_cases), 1, 'customer A can read their own case');
reset role;

select set_config('request.jwt.claims', '{"sub":"b2000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.verification_cases), 0, 'customer B cannot read customer A case');
reset role;

select set_config('request.jwt.claims', '{"sub":"e5000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.verification_cases), 0, 'lead in another department cannot read the case');
reset role;

select set_config('request.jwt.claims', '{"sub":"d4000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.verification_cases), 0, 'unassigned non-lead staff cannot read the case');
reset role;

select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.verification_cases), 1, 'department lead can read the department case');
reset role;

select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  format(
    'select public.assign_verification_case(%L::uuid, %L::uuid, %L)',
    (select id from pg_temp.slice_1_case_ids),
    'a1000000-0000-0000-0000-000000000001',
    'Customer cannot review own case'
  ),
  '42501',
  'Case customer cannot be assigned to their own case',
  'lead cannot assign a case to its customer'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  format(
    'select public.assign_verification_case(%L::uuid, %L::uuid, %L)',
    (select id from pg_temp.slice_1_case_ids),
    'd4000000-0000-0000-0000-000000000004',
    'Customer self-assignment attempt'
  ),
  '42501',
  'Case customer cannot assign their own case',
  'case customer cannot act as the assigning lead'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"d4000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  format(
    'select public.assign_verification_case(%L::uuid, %L::uuid, %L)',
    (select id from pg_temp.slice_1_case_ids),
    'd4000000-0000-0000-0000-000000000004',
    'Self assignment attempt'
  ),
  '42501',
  'An active lead in the case department must assign this case',
  'non-lead cannot assign a case'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"e5000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  format(
    'select public.assign_verification_case(%L::uuid, %L::uuid, %L)',
    (select id from pg_temp.slice_1_case_ids),
    'e5000000-0000-0000-0000-000000000005',
    'Cross department assignment attempt'
  ),
  '42501',
  'An active lead in the case department must assign this case',
  'lead in another department cannot assign the case'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  format(
    'select public.assign_verification_case(%L::uuid, %L::uuid, %L)',
    (select id from pg_temp.slice_1_case_ids),
    'd4000000-0000-0000-0000-000000000004',
    'Assigned manually for initial review.'
  ),
  'department lead can assign the case manually'
);
reset role;

select is(
  (select workflow_status from public.verification_cases where id = (select id from pg_temp.slice_1_case_ids)),
  'assigned',
  'assignment moves the case to assigned in the same transaction'
);
select is(
  (select count(*)::int from public.case_status_events where verification_case_id = (select id from pg_temp.slice_1_case_ids)),
  3,
  'assignment writes one customer event and one private staff note'
);
select is(
  (select count(*)::int from public.case_status_events where verification_case_id = (select id from pg_temp.slice_1_case_ids) and reason = 'A reviewer has been assigned to your case.' and customer_visible and event_kind = 'status_change'),
  1,
  'assignment customer event always uses fixed safe text'
);
select is(
  (select count(*)::int from public.case_status_events where verification_case_id = (select id from pg_temp.slice_1_case_ids) and reason = 'Assigned manually for initial review.' and not customer_visible and event_kind = 'staff_note'),
  1,
  'assignment lead note is private to staff'
);

select set_config('request.jwt.claims', '{"sub":"d4000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.verification_cases), 1, 'active assignee can read the assigned case');
select is((select count(*)::int from public.case_status_events where reason = 'Assigned manually for initial review.' and event_kind = 'staff_note'), 1, 'active assignee can read the private assignment note');
select throws_ok(
  format(
    'select public.transition_verification_case(%L::uuid, %L, %L, '''')',
    (select id from pg_temp.slice_1_case_ids),
    'closed',
    'Invalid early completion'
  ),
  '22023',
  'Invalid verification case status transition: assigned -> closed',
  'invalid status transition fails'
);
select lives_ok(
  format(
    'select public.transition_verification_case(%L::uuid, %L, %L)',
    (select id from pg_temp.slice_1_case_ids),
    'in_review',
    'Started the synthetic document-free review.'
  ),
  'active assignee can move assigned case into review'
);
select throws_ok(
  format(
    'update public.case_status_events set reason = %L where verification_case_id = %L::uuid',
    'Tampered note',
    (select id from pg_temp.slice_1_case_ids)
  ),
  '42501',
  null,
  'status events cannot be updated'
);
select throws_ok(
  format(
    'delete from public.case_status_events where verification_case_id = %L::uuid',
    (select id from pg_temp.slice_1_case_ids)
  ),
  '42501',
  null,
  'status events cannot be deleted'
);
select is((select count(*)::int from public.case_status_events), 5, 'status move writes separate customer status and staff-note events');
select is(
  (select count(*)::int from public.case_status_events where reason = 'Your case is now in review.' and customer_visible and event_kind = 'status_change'),
  1,
  'status move always writes fixed customer-safe status text'
);
select is(
  (select count(*)::int from public.case_status_events where reason = 'Started the synthetic document-free review.' and not customer_visible and event_kind = 'staff_note'),
  1,
  'staff note is recorded separately and remains staff-only'
);
select throws_ok(
  format(
    'update public.verification_cases set workflow_status = %L where id = %L::uuid',
    'closed',
    (select id from pg_temp.slice_1_case_ids)
  ),
  '42501',
  null,
  'direct workflow status update is denied'
);
select throws_ok(
  format(
    'insert into public.case_assignments (verification_case_id, assignee_user_id, assigned_by_user_id) values (%L::uuid, %L::uuid, %L::uuid)',
    (select id from pg_temp.slice_1_case_ids),
    'd4000000-0000-0000-0000-000000000004',
    'd4000000-0000-0000-0000-000000000004'
  ),
  '42501',
  null,
  'direct assignment insert is denied'
);
reset role;

update public.staff_members
set active = false
where user_id = 'd4000000-0000-0000-0000-000000000004';

select set_config('request.jwt.claims', '{"sub":"d4000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  format(
    'select public.transition_verification_case(%L::uuid, %L, %L, '''')',
    (select id from pg_temp.slice_1_case_ids),
    'needs_customer_info',
    'Attempt by a deactivated assignee'
  ),
  '42501',
  'Active staff access is required',
  'deactivated assignee cannot change case status'
);
reset role;

update public.staff_members
set active = true
where user_id = 'd4000000-0000-0000-0000-000000000004';

select set_config('request.jwt.claims', '{"sub":"d4000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  format(
    'select public.transition_verification_case(%L::uuid, %L, %L, %L)',
    (select id from pg_temp.slice_1_case_ids),
    'needs_customer_info',
    'Customer clarification is needed.',
    'Please provide the missing customer-safe details.'
  ),
  'active assignee can request customer information'
);
select throws_ok(
  format(
    'select public.transition_verification_case(%L::uuid, %L, %L, '''')',
    (select id from pg_temp.slice_1_case_ids),
    'in_review',
    'Review resumed after clarification.'
  ),
  '22023',
  null,
  'active assignee cannot resume review without a customer reply'
);
reset role;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  format('select public.customer_respond_to_case(%L::uuid, %L, %L::uuid)',
    (select id from pg_temp.slice_1_case_ids), 'Customer clarification supplied.',
    (select information_request_event_id from public.verification_cases where id=(select id from pg_temp.slice_1_case_ids))),
  'case owner resumes review through an explicit reply'
);
reset role;

select is(
  (select count(*)::int from public.case_status_events where reason = 'The review team needs more information from you.' and customer_visible and event_kind = 'information_requested'),
  1,
  'needs-information transition writes its fixed customer-safe status event'
);
select is(
  (select count(*)::int from public.case_status_events where reason = 'Please provide the missing customer-safe details.' and customer_visible and event_kind = 'information_requested'),
  1,
  'optional customer message is stored as a separate visible event'
);
select is(
  (select count(*)::int from public.case_status_events where reason in ('Customer clarification is needed.', 'Review resumed after clarification.') and customer_visible),
  0,
  'internal staff notes never become customer-visible'
);

select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  format(
    'select public.transition_verification_case(%L::uuid, %L, %L, '''')',
    (select id from pg_temp.slice_1_case_ids),
    'cancelled',
    'Lead attempted to bypass the active assignee.'
  ),
  '42501',
  'Only the active assignee can move this case',
  'department lead who is not the assignee cannot change case status'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"d4000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  format(
    'select public.transition_verification_case(%L::uuid, %L, %L, '''')',
    (select id from pg_temp.slice_1_case_ids),
    'cancelled',
    'Synthetic request cancelled without a verification result.'
  ),
  'active assignee can cancel a case from review'
);
reset role;

select is(
  (select count(*)::int from public.case_status_events where reason = 'This case was cancelled.' and customer_visible and event_kind = 'status_change'),
  1,
  'cancel transition writes fixed customer-safe status text'
);

select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.case_status_events), 7, 'customer sees fixed status events and the explicit customer message only');
select is((select count(*)::int from public.case_status_events where reason = 'A reviewer has been assigned to your case.' and event_kind = 'status_change'), 1, 'customer sees the fixed assignment update');
select is((select count(*)::int from public.case_status_events where reason = 'Assigned manually for initial review.' and event_kind = 'staff_note'), 0, 'customer cannot see the lead assignment note');
reset role;

select set_config('request.jwt.claims', '{"sub":"b2000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.case_status_events), 0, 'another customer cannot read case events');
reset role;

set local role anon;
select throws_ok(
  $$select count(*) from public.staff_members$$,
  '42501',
  null,
  'anonymous user cannot select staff members'
);
select throws_ok(
  $$select count(*) from public.verification_cases$$,
  '42501',
  null,
  'anonymous user cannot select verification cases'
);
select throws_ok(
  $$select count(*) from public.case_assignments$$,
  '42501',
  null,
  'anonymous user cannot select case assignments'
);
select throws_ok(
  $$select count(*) from public.case_status_events$$,
  '42501',
  null,
  'anonymous user cannot select case status events'
);
select throws_ok(
  $$select public.create_verification_case('Anonymous plot description', 'Kuje', 'Kuje', true, 'Near Kuje', null, 'email', null, false, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'buying', 'buyer', 'self', null, false)$$,
  '42501',
  null,
  'anonymous user cannot call case creation RPC'
);
select throws_ok(
  format(
    'select public.assign_verification_case(%L::uuid, %L::uuid, %L)',
    (select id from pg_temp.slice_1_case_ids),
    'd4000000-0000-0000-0000-000000000004',
    'Anonymous assignment'
  ),
  '42501',
  null,
  'anonymous user cannot call assignment RPC'
);
select throws_ok(
  format(
    'select public.transition_verification_case(%L::uuid, %L, %L, '''')',
    (select id from pg_temp.slice_1_case_ids),
    'needs_customer_info',
    'Anonymous transition'
  ),
  '42501',
  null,
  'anonymous user cannot call transition RPC'
);
reset role;

select * from finish();
rollback;
