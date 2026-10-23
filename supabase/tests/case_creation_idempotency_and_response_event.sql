-- Behavioural coverage for migration 021.
-- Runs only against the disposable local/CI Supabase database.
begin;
select plan(28);

select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'verification_cases'
      and column_name = 'idempotency_key'
      and data_type = 'uuid'
  ),
  'verification cases have a UUID idempotency key'
);
select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'case_status_events'
      and column_name = 'event_kind'
      and is_nullable = 'NO'
  ),
  'status events require an event kind'
);
select is(
  (
    select column_default
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'case_status_events'
      and column_name = 'event_kind'
  ),
  '''status_change''::text',
  'status events default to status_change'
);
select ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'verification_cases'
      and indexname = 'verification_cases_customer_idempotency_key_idx'
      and indexdef like '%UNIQUE%'
      and indexdef like '%WHERE (idempotency_key IS NOT NULL)%'
  ),
  'customer idempotency keys have a partial unique index'
);
select ok(
  to_regprocedure('public.create_verification_case(text,text,text,text)') is null,
  'the non-idempotent case creation signature is removed'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.create_verification_case(text,text,text,boolean,text,text,text,text,boolean,uuid)',
    'EXECUTE'
  ),
  'anonymous users cannot execute idempotent case creation'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.create_verification_case(text,text,text,boolean,text,text,text,text,boolean,uuid)',
    'EXECUTE'
  ),
  'authenticated users can execute idempotent case creation'
);

insert into auth.users (id, aud, role, email, raw_user_meta_data) values
  ('aa100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'idempotency-a@test.invalid', '{}'),
  ('bb200000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'idempotency-b@test.invalid', '{}'),
  ('cc300000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'idempotency-staff@test.invalid', '{}');

insert into public.staff_members (user_id, department, is_lead, active)
values ('cc300000-0000-4000-8000-000000000003', 'Verification', true, true);

create temporary table migration_021_results (
  attempt text primary key,
  case_id uuid not null
);
grant select, insert on table pg_temp.migration_021_results to authenticated;

select set_config('request.jwt.claims', '{"sub":"aa100000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
insert into pg_temp.migration_021_results values (
  'customer-a-first',
  public.create_verification_case(
    'DEMO DATA / NOT OFFICIAL idempotent case for customer A',
    'Kuje',
    'Kuje', true, 'Near Kuje town centre',
    'Synthetic request.',
    'email',
    null, false,
    '99999999-9999-4999-8999-999999999999'
  )
);
select public.submit_verification_case((select case_id from pg_temp.migration_021_results where attempt = 'customer-a-first'));
insert into pg_temp.migration_021_results values (
  'customer-a-replay',
  public.create_verification_case(
    'DEMO DATA / NOT OFFICIAL idempotent case for customer A',
    'Kuje',
    'Kuje', true, 'Near Kuje town centre',
    'Synthetic request.',
    'email',
    null, false,
    '99999999-9999-4999-8999-999999999999'
  )
);
select throws_ok(
  $$select public.create_verification_case(
    'DEMO DATA / NOT OFFICIAL materially different Kuje plot request',
    'Kuje',
    'Kuje', true, 'Near Kuje town centre',
    'Synthetic request.',
    'email',
    null, false,
    '99999999-9999-4999-8999-999999999999'
  )$$,
  '22023',
  'Idempotency key was already used with different request data',
  'same customer and key cannot be reused with materially different request data'
);
reset role;

select is(
  (select case_id from pg_temp.migration_021_results where attempt = 'customer-a-replay'),
  (select case_id from pg_temp.migration_021_results where attempt = 'customer-a-first'),
  'replaying a customer idempotency key returns the original case id'
);
select is(
  (
    select count(*)::int from public.verification_cases
    where customer_user_id = 'aa100000-0000-4000-8000-000000000001'
      and idempotency_key = '99999999-9999-4999-8999-999999999999'
  ),
  1,
  'replaying a key creates only one case'
);
select is(
  (
    select count(*)::int from public.case_status_events
    where verification_case_id = (
      select case_id from pg_temp.migration_021_results where attempt = 'customer-a-first'
    )
  ),
  1,
  'replaying a key creates only one set of case events'
);
select is(
  (
    select site_description from public.verification_cases
    where id = (
      select case_id from pg_temp.migration_021_results where attempt = 'customer-a-first'
    )
  ),
  'DEMO DATA / NOT OFFICIAL idempotent case for customer A',
  'rejected replay leaves the originally created case data unchanged'
);
select is(
  (
    select count(*)::int from public.audit_logs
    where action = 'verification_case.draft_created'
      and entity_id = (
        select case_id from pg_temp.migration_021_results where attempt = 'customer-a-first'
      )
  ),
  1,
  'replaying a key creates only one draft-creation audit record'
);
select is(
  (
    select event_kind from public.case_status_events
    where verification_case_id = (
      select case_id from pg_temp.migration_021_results where attempt = 'customer-a-first'
    )
  ),
  'status_change',
  'submission writes a fixed status-change event'
);

select set_config('request.jwt.claims', '{"sub":"bb200000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
insert into pg_temp.migration_021_results values (
  'customer-b-same-key',
  public.create_verification_case(
    'DEMO DATA / NOT OFFICIAL separate case for customer B',
    'Bwari',
    'Kubwa', true, 'Near Kubwa market',
    'Synthetic request.',
    'phone',
    '+2348012345678', true,
    '99999999-9999-4999-8999-999999999999'
  )
);
select public.submit_verification_case((select case_id from pg_temp.migration_021_results where attempt = 'customer-b-same-key'));
reset role;

select isnt(
  (select case_id from pg_temp.migration_021_results where attempt = 'customer-b-same-key'),
  (select case_id from pg_temp.migration_021_results where attempt = 'customer-a-first'),
  'a different customer using the same key receives a different case'
);
select is(
  (
    select count(*)::int from public.verification_cases
    where idempotency_key = '99999999-9999-4999-8999-999999999999'
  ),
  2,
  'the same key is independently scoped to two customers'
);
select is(
  (
    select count(*)::int from public.case_status_events
    where verification_case_id = (
      select case_id from pg_temp.migration_021_results where attempt = 'customer-b-same-key'
    )
  ),
  1,
  'the second customer receives one initial event set'
);

select throws_ok(
  format(
    'insert into public.case_status_events (verification_case_id, actor_user_id, from_status, to_status, reason, customer_visible, event_kind) values (%L::uuid, %L::uuid, null, %L, %L, true, %L)',
    (select case_id from pg_temp.migration_021_results where attempt = 'customer-a-first'),
    'aa100000-0000-4000-8000-000000000001',
    'submitted',
    'Invalid event kind fixture',
    'invalid_kind'
  ),
  '23514',
  null,
  'the event kind check constraint rejects unsupported values'
);

update public.verification_cases
set workflow_status = 'needs_customer_info'
where id = (
  select case_id from pg_temp.migration_021_results where attempt = 'customer-b-same-key'
);

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
  (select case_id from pg_temp.migration_021_results where attempt = 'customer-b-same-key'),
  'cc300000-0000-4000-8000-000000000003',
  'submitted',
  'needs_customer_info',
  'Private staff reasoning that the customer must never see.',
  false,
  'staff_note'
);

select set_config('request.jwt.claims', '{"sub":"bb200000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  format(
    'select public.customer_respond_to_case(%L::uuid, %L)',
    (select case_id from pg_temp.migration_021_results where attempt = 'customer-b-same-key'),
    'Synthetic customer clarification.'
  ),
  'the case customer can respond to an information request'
);
reset role;

select is(
  (
    select workflow_status from public.verification_cases
    where id = (
      select case_id from pg_temp.migration_021_results where attempt = 'customer-b-same-key'
    )
  ),
  'in_review',
  'a customer response returns the case to in_review'
);
select is(
  (
    select count(*)::int from public.case_status_events
    where verification_case_id = (
      select case_id from pg_temp.migration_021_results where attempt = 'customer-b-same-key'
    )
      and reason = 'Customer provided the requested information.'
      and event_kind = 'customer_response'
      and customer_visible
  ),
  1,
  'customer response writes the fixed visible response line and kind'
);
select is(
  (
    select count(*)::int from public.case_status_events
    where verification_case_id = (
      select case_id from pg_temp.migration_021_results where attempt = 'customer-b-same-key'
    )
      and reason = 'Synthetic customer clarification.'
      and event_kind = 'customer_response'
      and customer_visible
  ),
  1,
  'customer response preserves the customer text as a response event'
);
select is(
  (
    select count(*)::int from public.case_status_events
    where verification_case_id = (
      select case_id from pg_temp.migration_021_results where attempt = 'customer-b-same-key'
    )
      and event_kind = 'staff_note'
  ),
  1,
  'the staff-only fixture exists before the RLS visibility check'
);

select set_config('request.jwt.claims', '{"sub":"bb200000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select is(
  (
    select count(*)::int from public.case_status_events
    where verification_case_id = (
      select case_id from pg_temp.migration_021_results where attempt = 'customer-b-same-key'
    )
      and event_kind = 'staff_note'
  ),
  0,
  'the customer cannot see staff-only events'
);
select is(
  (
    select count(*)::int from public.case_status_events
    where verification_case_id = (
      select case_id from pg_temp.migration_021_results where attempt = 'customer-b-same-key'
    )
      and event_kind = 'customer_response'
  ),
  2,
  'the customer can see both customer-response events'
);
reset role;

update public.verification_cases
set workflow_status = 'closed'
where id = (
  select case_id from pg_temp.migration_021_results where attempt = 'customer-b-same-key'
);
select set_config('request.jwt.claims', '{"sub":"bb200000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  format(
    'select public.customer_respond_to_case(%L::uuid, %L)',
    (select case_id from pg_temp.migration_021_results where attempt = 'customer-b-same-key'),
    'Late response'
  ),
  '22023',
  'Closed or cancelled cases cannot accept customer responses',
  'a closed case rejects customer responses'
);
reset role;

update public.verification_cases
set workflow_status = 'cancelled'
where id = (
  select case_id from pg_temp.migration_021_results where attempt = 'customer-a-first'
);
select set_config('request.jwt.claims', '{"sub":"aa100000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  format(
    'select public.customer_respond_to_case(%L::uuid, %L)',
    (select case_id from pg_temp.migration_021_results where attempt = 'customer-a-first'),
    'Late response'
  ),
  '22023',
  'Closed or cancelled cases cannot accept customer responses',
  'a cancelled case rejects customer responses'
);
reset role;

set local role anon;
select throws_ok(
  $$select public.create_verification_case(
    'Anonymous plot description',
    'Kuje',
    'Kuje', true, 'Near Kuje',
    null,
    'email',
    null, false,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )$$,
  '42501',
  null,
  'anonymous execution of the new case creation function is denied'
);
reset role;

select * from finish();
rollback;
