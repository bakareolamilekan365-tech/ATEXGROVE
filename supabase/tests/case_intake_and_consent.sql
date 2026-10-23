begin;
select plan(37);

select ok(to_regprocedure('public.create_verification_case(text,text,text,boolean,text,text,text,text,boolean,uuid,text,text,text,text,boolean)') is not null, 'new create RPC includes the intake and representation arguments');
select ok(to_regprocedure('public.create_verification_case(text,text,text,boolean,text,text,text,text,boolean,uuid)') is null, 'old create RPC signature is removed');
select ok(to_regprocedure('public.submit_verification_case(uuid,text,boolean)') is not null, 'submit RPC requires notice version and explicit acceptance');
select ok(to_regprocedure('public.submit_verification_case(uuid)') is null, 'old submit RPC signature is removed');
select ok(not has_function_privilege('anon','public.create_verification_case(text,text,text,boolean,text,text,text,text,boolean,uuid,text,text,text,text,boolean)','EXECUTE'), 'anon cannot execute new create RPC');
select ok(not has_function_privilege('anon','public.submit_verification_case(uuid,text,boolean)','EXECUTE'), 'anon cannot execute new submit RPC');
select ok((select relrowsecurity from pg_class where oid='public.case_consents'::regclass), 'consent rows use RLS');
select ok(has_table_privilege('authenticated','public.case_consents','SELECT'), 'authenticated has consent SELECT');
select ok(not has_table_privilege('authenticated','public.case_consents','INSERT'), 'authenticated cannot directly insert consent');
select ok(not has_table_privilege('authenticated','public.case_consents','UPDATE') and not has_table_privilege('authenticated','public.case_consents','DELETE'), 'authenticated cannot directly update or delete consent');
select ok(not has_table_privilege('anon','public.case_consents','SELECT'), 'anon has no consent table grant');
select ok(not has_table_privilege('anon','public.case_consents','INSERT'), 'anon has no consent write grant');
select ok(not has_sequence_privilege('anon','public.verification_case_number_seq','USAGE'), 'anon cannot access the case-number sequence');
select ok(not has_sequence_privilege('authenticated','public.verification_case_number_seq','USAGE'), 'authenticated cannot access the case-number sequence');

create temporary table case_number_backfill_fixture(id uuid, created_at timestamptz, workflow_status text, discarded_at timestamptz, case_number text);
insert into case_number_backfill_fixture values
 ('00000000-0000-4000-8000-000000000002','2024-01-02T00:00:00Z','submitted',null,null),
 ('00000000-0000-4000-8000-000000000001','2024-01-01T00:00:00Z','closed',null,null),
 ('00000000-0000-4000-8000-000000000003','2024-01-03T00:00:00Z','cancelled','2024-01-04T00:00:00Z',null);
with numbered as (
  select id, created_at, row_number() over (order by created_at, id) as serial
  from case_number_backfill_fixture
  where workflow_status in ('submitted','assigned','in_review','needs_customer_info','closed','cancelled')
    and discarded_at is null
)
update case_number_backfill_fixture fixture
set case_number='ATX-LV-'||extract(year from numbered.created_at)::integer::text||'-'||lpad(numbered.serial::text,6,'0')
from numbered where fixture.id=numbered.id;
select is((select array_agg(case_number order by created_at,id) from case_number_backfill_fixture where discarded_at is null),array['ATX-LV-2024-000001','ATX-LV-2024-000002']::text[],'backfill numbers submitted-or-later rows in creation order');
select is((select case_number from case_number_backfill_fixture where discarded_at is not null),null,'discarded unsubmitted drafts are excluded from number backfill');

insert into auth.users (id,aud,role,email,raw_user_meta_data) values
 ('a2400000-0000-4000-8000-000000000001','authenticated','authenticated','intake-owner@test.invalid','{}'),
 ('b2400000-0000-4000-8000-000000000002','authenticated','authenticated','intake-other@test.invalid','{}'),
 ('c2400000-0000-4000-8000-000000000003','authenticated','authenticated','intake-lead@test.invalid','{}'),
 ('d2400000-0000-4000-8000-000000000004','authenticated','authenticated','intake-other-lead@test.invalid','{}');
insert into public.staff_members(user_id,department,is_lead,active) values
 ('c2400000-0000-4000-8000-000000000003','Verification',true,true),
 ('d2400000-0000-4000-8000-000000000004','Operations',true,true);

select set_config('request.jwt.claims','{"sub":"a2400000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select throws_ok($$select public.create_verification_case('DEMO DATA / NOT OFFICIAL synthetic site description','Kuje','Kuje',true,'Near Kuje market','', 'email',null,false,'a2411111-1111-4111-8111-111111111111','buying','buyer','another_person',null,false)$$,'22023','Enter the name of the person or organisation (up to 200 characters)','representation requires a principal name');
select throws_ok($$select public.create_verification_case('DEMO DATA / NOT OFFICIAL synthetic site description','Kuje','Kuje',true,'Near Kuje market','', 'email',null,false,'a2422222-2222-4222-8222-222222222222','buying','buyer','organisation','Demo Company',false)$$,'22023','Confirm that you are authorised to submit this request on their behalf','representation requires authority confirmation');
create temporary table intake_results(case_id uuid);
grant select,insert on pg_temp.intake_results to authenticated;
insert into pg_temp.intake_results values (public.create_verification_case(
 'DEMO DATA / NOT OFFICIAL synthetic site description','Kuje','Kuje',true,'Near Kuje market','',
 'email',null,false,'a2433333-3333-4333-8333-333333333333','representing_someone','agent_or_representative',
 'another_person','Synthetic Principal',true));
select is((select workflow_status from public.verification_cases where id=(select case_id from pg_temp.intake_results)),'draft','case creation remains draft before submission');
select is((select case_number from public.verification_cases where id=(select case_id from pg_temp.intake_results)),null,'draft creation does not allocate a case number');
select is((select customer_intent from public.verification_cases where id=(select case_id from pg_temp.intake_results)),'representing_someone','customer intent is stored as a claim');
select is((select authority_confirmed from public.verification_cases where id=public.create_verification_case('DEMO DATA / NOT OFFICIAL self request synthetic site description','Kuje','Kuje',true,'Near Kuje market','', 'email',null,false,'a2455555-5555-4555-8555-555555555555','buying','buyer','self',null,false)),null,'authority confirmation is null when the customer acts for themself');
select throws_ok($$select public.create_verification_case('DEMO DATA / NOT OFFICIAL synthetic site description','Kuje','Kuje',true,'Near Kuje market','', 'email',null,false,'a2444444-4444-4444-8444-444444444444','buying','buyer','self','Unexpected Principal',false)$$,'22023','For a request for yourself, principal details and authority confirmation must be empty','self-representation rejects an extraneous principal');
select lives_ok($$select public.submit_verification_case((select case_id from pg_temp.intake_results),'case-service-scope-v1',true)$$,'customer can submit after accepting current notice');
select is((select case_number ~ '^ATX-LV-[0-9]{4}-[0-9]{6}$' from public.verification_cases where id=(select case_id from pg_temp.intake_results)),true,'submission assigns a formatted human-readable case number');
reset role;
select throws_ok($$insert into public.verification_cases(customer_user_id,created_by_user_id,site_description,area_lga,area_name,area_is_listed,address_line,contact_preference,workflow_status,case_number) values ('b2400000-0000-4000-8000-000000000002','b2400000-0000-4000-8000-000000000002','DEMO DATA / NOT OFFICIAL another synthetic case','Kuje','Kuje',true,'Near Kuje market','email','submitted',(select case_number from public.verification_cases where id=(select case_id from pg_temp.intake_results)))$$,'23505',null,'case numbers are unique');
set local role authenticated;
select is((select count(*)::int from public.case_consents where verification_case_id=(select case_id from pg_temp.intake_results) and consent_type='case_service_scope'),1,'submission records one service-scope consent');
select lives_ok($$select public.submit_verification_case((select case_id from pg_temp.intake_results),'case-service-scope-v1',true)$$,'submitting again is idempotent');
select is((select count(*)::int from public.case_consents where verification_case_id=(select case_id from pg_temp.intake_results)),1,'replay does not duplicate consent');
select throws_ok($$select public.submit_verification_case((select case_id from pg_temp.intake_results),'case-service-scope-v1',false)$$,'22023','Service scope acceptance is required','submission refuses missing acceptance');
select throws_ok($$select public.submit_verification_case((select case_id from pg_temp.intake_results),'old-notice',true)$$,'22023','The service notice has changed; review and accept the current notice','submission refuses a stale notice version');
select throws_ok($$insert into public.case_consents(verification_case_id,customer_user_id,consent_type,notice_version) values ((select case_id from pg_temp.intake_results),'a2400000-0000-4000-8000-000000000001','case_service_scope','direct')$$,'42501',null,'customer cannot directly write a consent row');
reset role;

select is((select count(*)::int from public.case_consents where verification_case_id=(select case_id from pg_temp.intake_results)),1,'privileged test context can inspect the recorded row');
select set_config('request.jwt.claims','{"sub":"a2400000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*)::int from public.case_consents where verification_case_id=(select case_id from pg_temp.intake_results)),1,'customer can read own consent');
reset role;
select set_config('request.jwt.claims','{"sub":"b2400000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*)::int from public.case_consents where verification_case_id=(select case_id from pg_temp.intake_results)),0,'another customer cannot read consent');
reset role;
select set_config('request.jwt.claims','{"sub":"c2400000-0000-4000-8000-000000000003","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*)::int from public.case_consents where verification_case_id=(select case_id from pg_temp.intake_results)),1,'scoped department staff can read consent');
reset role;
select set_config('request.jwt.claims','{"sub":"d2400000-0000-4000-8000-000000000004","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*)::int from public.case_consents where verification_case_id=(select case_id from pg_temp.intake_results)),0,'out-of-scope staff cannot read consent');
reset role;
select * from finish();
rollback;
