begin;
select plan(47);

select ok(not has_function_privilege('anon', 'public.create_verification_case(text,text,text,boolean,text,text,text,text,boolean,uuid)', 'EXECUTE'), 'anon cannot execute draft creation');
select ok(not has_function_privilege('anon', 'public.submit_verification_case(uuid)', 'EXECUTE'), 'anon cannot submit drafts');
select ok(not has_function_privilege('anon', 'public.discard_draft_case(uuid)', 'EXECUTE'), 'anon cannot discard drafts');
select ok(not has_function_privilege('anon', 'public.cancel_verification_case(uuid,text)', 'EXECUTE'), 'anon cannot cancel cases');

insert into auth.users (id, aud, role, email, raw_user_meta_data) values
 ('a1100000-0000-4000-8000-000000000001','authenticated','authenticated','draft-owner@test.invalid','{}'),
 ('b2200000-0000-4000-8000-000000000002','authenticated','authenticated','draft-other@test.invalid','{}'),
 ('c3300000-0000-4000-8000-000000000003','authenticated','authenticated','draft-lead@test.invalid','{}'),
 ('d4400000-0000-4000-8000-000000000004','authenticated','authenticated','draft-staff@test.invalid','{}');
insert into public.staff_members(user_id, department, is_lead, active) values
 ('c3300000-0000-4000-8000-000000000003','Verification',true,true),
 ('d4400000-0000-4000-8000-000000000004','Verification',false,true);

select set_config('request.jwt.claims','{"sub":"a1100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is(public.create_verification_case(
 'DEMO DATA / NOT OFFICIAL sample plot near Kuje market','Kuje','Kuje',true,
 'Near Kuje market road','Synthetic request','email',null,false,
 '11111111-1111-4111-8111-111111111111'),
 (select id from public.verification_cases where idempotency_key='11111111-1111-4111-8111-111111111111'),
 'creation returns its case id');
select is((select workflow_status from public.verification_cases where idempotency_key='11111111-1111-4111-8111-111111111111'),'draft','new request is a draft');
select is((select count(*)::int from public.case_status_events where verification_case_id=(select id from public.verification_cases where idempotency_key='11111111-1111-4111-8111-111111111111') and customer_visible),0,'draft creation writes no customer-visible event');
select is((select count(*)::int from public.audit_logs where action='verification_case.draft_created' and entity_id=(select id from public.verification_cases where idempotency_key='11111111-1111-4111-8111-111111111111')),1,'draft creation is audited once');
select is(public.create_verification_case(
 'DEMO DATA / NOT OFFICIAL sample plot near Kuje market','Kuje','Kuje',true,
 'Near Kuje market road','Synthetic request','email',null,false,
 '11111111-1111-4111-8111-111111111111'),
 (select id from public.verification_cases where idempotency_key='11111111-1111-4111-8111-111111111111'),
 'creation replay returns the same draft');
select is((select count(*)::int from public.verification_cases where idempotency_key='11111111-1111-4111-8111-111111111111'),1,'idempotency key creates one case');
select is((select count(*)::int from public.audit_logs where action='verification_case.draft_created' and entity_id=(select id from public.verification_cases where idempotency_key='11111111-1111-4111-8111-111111111111')),1,'replay does not duplicate draft audit');
select set_config('test.draft_case_id',(select id::text from public.verification_cases where idempotency_key='11111111-1111-4111-8111-111111111111'),true);

-- Customer can upload/register evidence while the case is still a draft.
select lives_ok($$insert into storage.objects(bucket_id,name,owner_id) values
 ('documents','documents/cases/'||(select id::text from public.verification_cases where idempotency_key='11111111-1111-4111-8111-111111111111')||'/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/draft.pdf','a1100000-0000-4000-8000-000000000001')$$,'owner can upload to draft path');
select lives_ok($$select public.register_case_evidence(
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 (select id from public.verification_cases where idempotency_key='11111111-1111-4111-8111-111111111111'),
 'title_deed_copy','Synthetic draft deed',
 'documents/cases/'||(select id::text from public.verification_cases where idempotency_key='11111111-1111-4111-8111-111111111111')||'/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/draft.pdf',
 'draft.pdf','application/pdf',1024,null)$$,'owner can register evidence on draft');
reset role;

select set_config('request.jwt.claims','{"sub":"c3300000-0000-4000-8000-000000000003","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*)::int from public.verification_cases where id=current_setting('test.draft_case_id')::uuid),0,'department lead cannot see a draft case');
select is((select count(*)::int from public.case_status_events where verification_case_id=current_setting('test.draft_case_id')::uuid),0,'department lead cannot see draft events');
select is((select count(*)::int from public.case_evidence where verification_case_id=current_setting('test.draft_case_id')::uuid),0,'department lead cannot see draft evidence');
select is((select count(*)::int from storage.objects where bucket_id='documents'),0,'department lead cannot read draft evidence objects');
select throws_ok($$select * from public.authorize_case_evidence_download('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')$$,'42501',null,'staff download of draft evidence is denied');
reset role;

select set_config('request.jwt.claims','{"sub":"d4400000-0000-4000-8000-000000000004","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*)::int from public.verification_cases where id=current_setting('test.draft_case_id')::uuid),0,'non-lead staff cannot see a draft');
select is((select count(*)::int from public.case_status_events where verification_case_id=current_setting('test.draft_case_id')::uuid),0,'non-lead staff cannot see draft events');
select is((select count(*)::int from public.case_evidence where verification_case_id=current_setting('test.draft_case_id')::uuid),0,'non-lead staff cannot see draft evidence');
select is((select count(*)::int from storage.objects where bucket_id='documents'),0,'non-lead staff cannot read draft evidence objects');
reset role;

select set_config('request.jwt.claims','{"sub":"b2200000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select throws_ok($$select public.submit_verification_case((select id from public.verification_cases where idempotency_key='11111111-1111-4111-8111-111111111111'))$$,'42501',null,'another customer cannot submit draft');
reset role;
select set_config('request.jwt.claims','{"sub":"a1100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select lives_ok($$select public.submit_verification_case((select id from public.verification_cases where idempotency_key='11111111-1111-4111-8111-111111111111'))$$,'owner submits draft');
select lives_ok($$select public.submit_verification_case((select id from public.verification_cases where idempotency_key='11111111-1111-4111-8111-111111111111'))$$,'submit replay succeeds');
select is((select count(*)::int from public.case_status_events where verification_case_id=(select id from public.verification_cases where idempotency_key='11111111-1111-4111-8111-111111111111') and reason='Request submitted by customer.'),1,'submit writes one fixed customer event');
select is((select workflow_status from public.verification_cases where idempotency_key='11111111-1111-4111-8111-111111111111'),'submitted','submitted draft transitions to submitted');
select throws_ok($$select public.discard_draft_case((select id from public.verification_cases where idempotency_key='11111111-1111-4111-8111-111111111111'))$$,'22023',null,'submitted case cannot be discarded as a draft');
reset role;

-- Seed states to exercise allowed customer cancellations, including assignment cleanup.
insert into public.verification_cases(id,customer_user_id,created_by_user_id,site_description,area_lga,area_name,area_is_listed,address_line,contact_preference,workflow_status) values
 ('22222222-2222-4222-8222-222222222222','a1100000-0000-4000-8000-000000000001','a1100000-0000-4000-8000-000000000001','DEMO DATA / NOT OFFICIAL submitted case','AMAC','Garki',true,'Near Garki market','email','submitted'),
 ('33333333-3333-4333-8333-333333333333','a1100000-0000-4000-8000-000000000001','a1100000-0000-4000-8000-000000000001','DEMO DATA / NOT OFFICIAL assigned case','AMAC','Garki',true,'Near Garki market','email','assigned'),
 ('44444444-4444-4444-8444-444444444444','a1100000-0000-4000-8000-000000000001','a1100000-0000-4000-8000-000000000001','DEMO DATA / NOT OFFICIAL review case','AMAC','Garki',true,'Near Garki market','email','in_review'),
 ('55555555-5555-4555-8555-555555555555','a1100000-0000-4000-8000-000000000001','a1100000-0000-4000-8000-000000000001','DEMO DATA / NOT OFFICIAL info case','AMAC','Garki',true,'Near Garki market','email','needs_customer_info'),
 ('66666666-6666-4666-8666-666666666666','a1100000-0000-4000-8000-000000000001','a1100000-0000-4000-8000-000000000001','DEMO DATA / NOT OFFICIAL closed case','AMAC','Garki',true,'Near Garki market','email','closed'),
 ('77777777-7777-4777-8777-777777777777','a1100000-0000-4000-8000-000000000001','a1100000-0000-4000-8000-000000000001','DEMO DATA / NOT OFFICIAL cancelled case','AMAC','Garki',true,'Near Garki market','email','cancelled'),
 ('88888888-8888-4888-8888-888888888888','a1100000-0000-4000-8000-000000000001','a1100000-0000-4000-8000-000000000001','DEMO DATA / NOT OFFICIAL discard draft','AMAC','Garki',true,'Near Garki market','email','draft'),
 ('99999999-9999-4999-8999-999999999999','a1100000-0000-4000-8000-000000000001','a1100000-0000-4000-8000-000000000001','DEMO DATA / NOT OFFICIAL pre-existing case','Kuje',null,null,null,'email','submitted');
insert into public.case_assignments(verification_case_id,assignee_user_id,assigned_by_user_id,status)
values('33333333-3333-4333-8333-333333333333','d4400000-0000-4000-8000-000000000004','c3300000-0000-4000-8000-000000000003','active');

select set_config('request.jwt.claims','{"sub":"a1100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select lives_ok($$select public.discard_draft_case('88888888-8888-4888-8888-888888888888')$$,'owner discards a draft');
select is((select workflow_status from public.verification_cases where id='88888888-8888-4888-8888-888888888888'),'cancelled','discard marks draft cancelled');
select lives_ok($$select public.cancel_verification_case('22222222-2222-4222-8222-222222222222','No longer needed')$$,'customer can cancel submitted case');
select lives_ok($$select public.cancel_verification_case('33333333-3333-4333-8333-333333333333','')$$,'customer can cancel assigned case');
select lives_ok($$select public.cancel_verification_case('44444444-4444-4444-8444-444444444444','')$$,'customer can cancel in-review case');
select lives_ok($$select public.cancel_verification_case('55555555-5555-4555-8555-555555555555','')$$,'customer can cancel needs-information case');
select throws_ok($$select public.cancel_verification_case('66666666-6666-4666-8666-666666666666','')$$,'22023',null,'closed case cannot be cancelled');
select throws_ok($$select public.cancel_verification_case('77777777-7777-4777-8777-777777777777','')$$,'22023',null,'cancelled case cannot be cancelled again');
select throws_ok($$select public.cancel_verification_case('11111111-1111-4111-8111-111111111111','')$$,'22023',null,'draft cannot use open-case cancellation');
select is((select status from public.case_assignments where verification_case_id='33333333-3333-4333-8333-333333333333'),'cancelled','cancelling ends active assignment');
select is((select count(*)::int from public.case_status_events where verification_case_id='22222222-2222-4222-8222-222222222222' and reason='You cancelled this request.' and customer_visible and event_kind='status_change'),1,'customer cancellation writes fixed visible event');
select is((select reason from public.case_status_events where verification_case_id='22222222-2222-4222-8222-222222222222' and event_kind='staff_note'),'No longer needed','cancellation reason is a private staff note');
reset role;

select set_config('request.jwt.claims','{"sub":"c3300000-0000-4000-8000-000000000003","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*)::int from public.verification_cases where id='88888888-8888-4888-8888-888888888888'),0,'staff cannot see a discarded draft');
select is((select count(*)::int from public.case_status_events where verification_case_id='88888888-8888-4888-8888-888888888888'),0,'staff cannot see discarded-draft events');
reset role;

select set_config('request.jwt.claims','{"sub":"b2200000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select throws_ok($$select public.cancel_verification_case('44444444-4444-4444-8444-444444444444','')$$,'42501',null,'another customer cannot cancel');
reset role;
select set_config('request.jwt.claims','{"sub":"a1100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*)::int from public.case_status_events where verification_case_id='22222222-2222-4222-8222-222222222222' and not customer_visible),0,'customer cannot see private cancellation note');
select throws_ok($$select public.register_case_evidence('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','66666666-6666-4666-8666-666666666666','other','Closed upload','documents/cases/66666666-6666-4666-8666-666666666666/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/file.pdf','file.pdf','application/pdf',20,null)$$,'22023','This case is not accepting evidence','evidence registration refuses closed cases');
select throws_ok($$select public.register_case_evidence('cccccccc-cccc-4ccc-8ccc-cccccccccccc','77777777-7777-4777-8777-777777777777','other','Cancelled upload','documents/cases/77777777-7777-4777-8777-777777777777/cccccccc-cccc-4ccc-8ccc-cccccccccccc/file.pdf','file.pdf','application/pdf',20,null)$$,'22023','This case is not accepting evidence','evidence registration refuses cancelled cases');
select is((select workflow_status from public.verification_cases where id='99999999-9999-4999-8999-999999999999'),'submitted','legacy-style pre-existing case status remains unchanged');
reset role;

select * from finish();
rollback;
