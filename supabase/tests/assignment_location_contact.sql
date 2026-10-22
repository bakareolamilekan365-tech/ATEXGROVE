-- Behavioural coverage for migration 022. Runs on disposable local/CI Supabase only.
begin;
select plan(8);

select ok(
  not has_function_privilege('anon', 'public.create_verification_case(text,text,text,boolean,text,text,text,text,boolean,uuid)', 'EXECUTE'),
  'anonymous callers cannot execute the revised case creation RPC'
);
select ok(
  not has_function_privilege('anon', 'public.assign_verification_case(uuid,uuid,text)', 'EXECUTE'),
  'anonymous callers cannot execute the revised assignment RPC'
);

insert into auth.users (id, aud, role, email, raw_user_meta_data)
values ('f6000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', 'location-contact@test.invalid', '{}');
create temporary table migration_022_case (id uuid primary key);
grant select, insert on table pg_temp.migration_022_case to authenticated;

select set_config('request.jwt.claims', '{"sub":"f6000000-0000-4000-8000-000000000006","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$select public.create_verification_case('DEMO DATA / NOT OFFICIAL a synthetic location', 'Not an FCT council', 'Kuje', true, 'Near Kuje', null, 'email', null, false, 'f6111111-1111-4111-8111-111111111111')$$,
  '22023', 'Choose one of the six FCT area councils', 'invalid council is rejected by the RPC'
);
select throws_ok(
  $$select public.create_verification_case('DEMO DATA / NOT OFFICIAL a synthetic location', 'Kuje', 'Kuje', true, 'Near Kuje', null, 'phone', null, false, 'f6222222-2222-4222-8222-222222222222')$$,
  '22023', 'Consent is required to use a phone number for this request', 'phone contact requires a number and consent'
);
select lives_ok(
  $$insert into pg_temp.migration_022_case values (public.create_verification_case('DEMO DATA / NOT OFFICIAL a synthetic location', 'Kuje', 'Unlisted Hamlet', false, 'Near Kuje town centre', null, 'whatsapp', '08012345678', true, 'f6333333-3333-4333-8333-333333333333'))$$,
  'unlisted free-text area and consented Nigerian number are accepted'
);
reset role;

select is(
  (select contact_phone from public.verification_cases where id = (select id from pg_temp.migration_022_case)),
  '+2348012345678',
  'Nigerian phone number is normalized before storage'
);
select is(
  (select count(*)::int from public.case_status_events where verification_case_id = (select id from pg_temp.migration_022_case) and (reason like '%08012345678%' or reason like '%+2348012345678%')),
  0,
  'phone number is absent from case events'
);
select is(
  (select count(*)::int from public.audit_logs where entity_id = (select id from pg_temp.migration_022_case) and (metadata::text like '%08012345678%' or metadata::text like '%+2348012345678%')),
  0,
  'phone number is absent from audit metadata'
);

select * from finish();
rollback;
