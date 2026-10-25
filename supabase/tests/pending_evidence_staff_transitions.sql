-- Every staff destination is checked with pending evidence present.
-- Fixture setup is privileged; all transitions, uploads and post-action state checks
-- use authenticated assignees/owners. No test infers safety from hidden staff rows.
begin;
select no_plan();
insert into auth.users(id,aud,role,email,raw_user_meta_data) values
 ('41000000-0000-4000-8000-000000000001','authenticated','authenticated','transition-owner@test.invalid','{}'),
 ('41000000-0000-4000-8000-000000000002','authenticated','authenticated','transition-assignee@test.invalid','{}');
insert into public.staff_members(user_id,department,is_lead,active) values
 ('41000000-0000-4000-8000-000000000002','Verification',false,true);
reset role;
insert into public.verification_cases(id,customer_user_id,created_by_user_id,site_description,area_lga,contact_preference,workflow_status)
values ('42000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','Synthetic staff transition draft','Kuje','email','needs_customer_info');
insert into public.case_assignments(verification_case_id,assignee_user_id,assigned_by_user_id,status)
values ('42000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000002','active');
insert into public.case_status_events(id,verification_case_id,actor_user_id,from_status,to_status,reason,customer_visible,event_kind)
values ('44000000-0000-4000-8000-000000000001','42000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000002','in_review','needs_customer_info','Please supply clarification.',true,'information_requested');
update public.verification_cases set information_request_event_id='44000000-0000-4000-8000-000000000001' where id='42000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}',true); set local role authenticated;
insert into storage.objects(bucket_id,name,owner_id) values ('documents','documents/cases/42000000-0000-4000-8000-000000000001/43000000-0000-4000-8000-000000000001/synthetic.pdf','41000000-0000-4000-8000-000000000001');
select lives_ok($$select public.register_case_evidence('43000000-0000-4000-8000-000000000001','42000000-0000-4000-8000-000000000001','other','Synthetic transition evidence','documents/cases/42000000-0000-4000-8000-000000000001/43000000-0000-4000-8000-000000000001/synthetic.pdf','synthetic.pdf','application/pdf',100,null)$$,'owner prepares pending file before staff attempts draft');
reset role; select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000002","role":"authenticated"}',true); set local role authenticated;
select throws_ok($$select public.transition_verification_case('42000000-0000-4000-8000-000000000001','draft','Synthetic staff decision','')$$,'22023',null,'staff cannot move pending preparation to draft');
reset role; select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}',true); set local role authenticated;
select is((select workflow_status from public.verification_cases where id='42000000-0000-4000-8000-000000000001'),'needs_customer_info','owner sees correct state after staff attempts draft');
select is((select submitted_at from public.case_evidence where id='43000000-0000-4000-8000-000000000001'),null::timestamptz,'staff draft never releases the pending file');
select is((select count(*)::int from public.verification_cases vc join public.case_evidence ce on ce.verification_case_id=vc.id where vc.id='42000000-0000-4000-8000-000000000001' and vc.workflow_status='in_review' and vc.discarded_at is null and ce.submitted_at is null),0,'staff draft cannot strand pending evidence in review');
select lives_ok($$select public.customer_respond_to_case('42000000-0000-4000-8000-000000000001','Requested clarification supplied.','44000000-0000-4000-8000-000000000001')$$,'owner reply remains possible after rejected draft');
select is((select workflow_status from public.verification_cases where id='42000000-0000-4000-8000-000000000001'),'in_review','only customer reply resumes after draft');
select ok((select submitted_at is not null from public.case_evidence where id='43000000-0000-4000-8000-000000000001'),'customer reply releases file after draft');
reset role;
insert into public.verification_cases(id,customer_user_id,created_by_user_id,site_description,area_lga,contact_preference,workflow_status)
values ('42000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','Synthetic staff transition submitted','Kuje','email','needs_customer_info');
insert into public.case_assignments(verification_case_id,assignee_user_id,assigned_by_user_id,status)
values ('42000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000002','active');
insert into public.case_status_events(id,verification_case_id,actor_user_id,from_status,to_status,reason,customer_visible,event_kind)
values ('44000000-0000-4000-8000-000000000002','42000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000002','in_review','needs_customer_info','Please supply clarification.',true,'information_requested');
update public.verification_cases set information_request_event_id='44000000-0000-4000-8000-000000000002' where id='42000000-0000-4000-8000-000000000002';
select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}',true); set local role authenticated;
insert into storage.objects(bucket_id,name,owner_id) values ('documents','documents/cases/42000000-0000-4000-8000-000000000002/43000000-0000-4000-8000-000000000002/synthetic.pdf','41000000-0000-4000-8000-000000000001');
select lives_ok($$select public.register_case_evidence('43000000-0000-4000-8000-000000000002','42000000-0000-4000-8000-000000000002','other','Synthetic transition evidence','documents/cases/42000000-0000-4000-8000-000000000002/43000000-0000-4000-8000-000000000002/synthetic.pdf','synthetic.pdf','application/pdf',100,null)$$,'owner prepares pending file before staff attempts submitted');
reset role; select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000002","role":"authenticated"}',true); set local role authenticated;
select throws_ok($$select public.transition_verification_case('42000000-0000-4000-8000-000000000002','submitted','Synthetic staff decision','')$$,'22023',null,'staff cannot move pending preparation to submitted');
reset role; select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}',true); set local role authenticated;
select is((select workflow_status from public.verification_cases where id='42000000-0000-4000-8000-000000000002'),'needs_customer_info','owner sees correct state after staff attempts submitted');
select is((select submitted_at from public.case_evidence where id='43000000-0000-4000-8000-000000000002'),null::timestamptz,'staff submitted never releases the pending file');
select is((select count(*)::int from public.verification_cases vc join public.case_evidence ce on ce.verification_case_id=vc.id where vc.id='42000000-0000-4000-8000-000000000002' and vc.workflow_status='in_review' and vc.discarded_at is null and ce.submitted_at is null),0,'staff submitted cannot strand pending evidence in review');
select lives_ok($$select public.customer_respond_to_case('42000000-0000-4000-8000-000000000002','Requested clarification supplied.','44000000-0000-4000-8000-000000000002')$$,'owner reply remains possible after rejected submitted');
select is((select workflow_status from public.verification_cases where id='42000000-0000-4000-8000-000000000002'),'in_review','only customer reply resumes after submitted');
select ok((select submitted_at is not null from public.case_evidence where id='43000000-0000-4000-8000-000000000002'),'customer reply releases file after submitted');
reset role;
insert into public.verification_cases(id,customer_user_id,created_by_user_id,site_description,area_lga,contact_preference,workflow_status)
values ('42000000-0000-4000-8000-000000000003','41000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','Synthetic staff transition assigned','Kuje','email','needs_customer_info');
insert into public.case_assignments(verification_case_id,assignee_user_id,assigned_by_user_id,status)
values ('42000000-0000-4000-8000-000000000003','41000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000002','active');
insert into public.case_status_events(id,verification_case_id,actor_user_id,from_status,to_status,reason,customer_visible,event_kind)
values ('44000000-0000-4000-8000-000000000003','42000000-0000-4000-8000-000000000003','41000000-0000-4000-8000-000000000002','in_review','needs_customer_info','Please supply clarification.',true,'information_requested');
update public.verification_cases set information_request_event_id='44000000-0000-4000-8000-000000000003' where id='42000000-0000-4000-8000-000000000003';
select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}',true); set local role authenticated;
insert into storage.objects(bucket_id,name,owner_id) values ('documents','documents/cases/42000000-0000-4000-8000-000000000003/43000000-0000-4000-8000-000000000003/synthetic.pdf','41000000-0000-4000-8000-000000000001');
select lives_ok($$select public.register_case_evidence('43000000-0000-4000-8000-000000000003','42000000-0000-4000-8000-000000000003','other','Synthetic transition evidence','documents/cases/42000000-0000-4000-8000-000000000003/43000000-0000-4000-8000-000000000003/synthetic.pdf','synthetic.pdf','application/pdf',100,null)$$,'owner prepares pending file before staff attempts assigned');
reset role; select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000002","role":"authenticated"}',true); set local role authenticated;
select throws_ok($$select public.transition_verification_case('42000000-0000-4000-8000-000000000003','assigned','Synthetic staff decision','')$$,'22023',null,'staff cannot move pending preparation to assigned');
reset role; select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}',true); set local role authenticated;
select is((select workflow_status from public.verification_cases where id='42000000-0000-4000-8000-000000000003'),'needs_customer_info','owner sees correct state after staff attempts assigned');
select is((select submitted_at from public.case_evidence where id='43000000-0000-4000-8000-000000000003'),null::timestamptz,'staff assigned never releases the pending file');
select is((select count(*)::int from public.verification_cases vc join public.case_evidence ce on ce.verification_case_id=vc.id where vc.id='42000000-0000-4000-8000-000000000003' and vc.workflow_status='in_review' and vc.discarded_at is null and ce.submitted_at is null),0,'staff assigned cannot strand pending evidence in review');
select lives_ok($$select public.customer_respond_to_case('42000000-0000-4000-8000-000000000003','Requested clarification supplied.','44000000-0000-4000-8000-000000000003')$$,'owner reply remains possible after rejected assigned');
select is((select workflow_status from public.verification_cases where id='42000000-0000-4000-8000-000000000003'),'in_review','only customer reply resumes after assigned');
select ok((select submitted_at is not null from public.case_evidence where id='43000000-0000-4000-8000-000000000003'),'customer reply releases file after assigned');
reset role;
insert into public.verification_cases(id,customer_user_id,created_by_user_id,site_description,area_lga,contact_preference,workflow_status)
values ('42000000-0000-4000-8000-000000000004','41000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','Synthetic staff transition in_review','Kuje','email','needs_customer_info');
insert into public.case_assignments(verification_case_id,assignee_user_id,assigned_by_user_id,status)
values ('42000000-0000-4000-8000-000000000004','41000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000002','active');
insert into public.case_status_events(id,verification_case_id,actor_user_id,from_status,to_status,reason,customer_visible,event_kind)
values ('44000000-0000-4000-8000-000000000004','42000000-0000-4000-8000-000000000004','41000000-0000-4000-8000-000000000002','in_review','needs_customer_info','Please supply clarification.',true,'information_requested');
update public.verification_cases set information_request_event_id='44000000-0000-4000-8000-000000000004' where id='42000000-0000-4000-8000-000000000004';
select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}',true); set local role authenticated;
insert into storage.objects(bucket_id,name,owner_id) values ('documents','documents/cases/42000000-0000-4000-8000-000000000004/43000000-0000-4000-8000-000000000004/synthetic.pdf','41000000-0000-4000-8000-000000000001');
select lives_ok($$select public.register_case_evidence('43000000-0000-4000-8000-000000000004','42000000-0000-4000-8000-000000000004','other','Synthetic transition evidence','documents/cases/42000000-0000-4000-8000-000000000004/43000000-0000-4000-8000-000000000004/synthetic.pdf','synthetic.pdf','application/pdf',100,null)$$,'owner prepares pending file before staff attempts in_review');
reset role; select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000002","role":"authenticated"}',true); set local role authenticated;
select throws_ok($$select public.transition_verification_case('42000000-0000-4000-8000-000000000004','in_review','Synthetic staff decision','')$$,'22023',null,'staff cannot move pending preparation to in_review');
reset role; select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}',true); set local role authenticated;
select is((select workflow_status from public.verification_cases where id='42000000-0000-4000-8000-000000000004'),'needs_customer_info','owner sees correct state after staff attempts in_review');
select is((select submitted_at from public.case_evidence where id='43000000-0000-4000-8000-000000000004'),null::timestamptz,'staff in_review never releases the pending file');
select is((select count(*)::int from public.verification_cases vc join public.case_evidence ce on ce.verification_case_id=vc.id where vc.id='42000000-0000-4000-8000-000000000004' and vc.workflow_status='in_review' and vc.discarded_at is null and ce.submitted_at is null),0,'staff in_review cannot strand pending evidence in review');
select lives_ok($$select public.customer_respond_to_case('42000000-0000-4000-8000-000000000004','Requested clarification supplied.','44000000-0000-4000-8000-000000000004')$$,'owner reply remains possible after rejected in_review');
select is((select workflow_status from public.verification_cases where id='42000000-0000-4000-8000-000000000004'),'in_review','only customer reply resumes after in_review');
select ok((select submitted_at is not null from public.case_evidence where id='43000000-0000-4000-8000-000000000004'),'customer reply releases file after in_review');
reset role;
insert into public.verification_cases(id,customer_user_id,created_by_user_id,site_description,area_lga,contact_preference,workflow_status)
values ('42000000-0000-4000-8000-000000000005','41000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','Synthetic staff transition needs_customer_info','Kuje','email','needs_customer_info');
insert into public.case_assignments(verification_case_id,assignee_user_id,assigned_by_user_id,status)
values ('42000000-0000-4000-8000-000000000005','41000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000002','active');
insert into public.case_status_events(id,verification_case_id,actor_user_id,from_status,to_status,reason,customer_visible,event_kind)
values ('44000000-0000-4000-8000-000000000005','42000000-0000-4000-8000-000000000005','41000000-0000-4000-8000-000000000002','in_review','needs_customer_info','Please supply clarification.',true,'information_requested');
update public.verification_cases set information_request_event_id='44000000-0000-4000-8000-000000000005' where id='42000000-0000-4000-8000-000000000005';
select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}',true); set local role authenticated;
insert into storage.objects(bucket_id,name,owner_id) values ('documents','documents/cases/42000000-0000-4000-8000-000000000005/43000000-0000-4000-8000-000000000005/synthetic.pdf','41000000-0000-4000-8000-000000000001');
select lives_ok($$select public.register_case_evidence('43000000-0000-4000-8000-000000000005','42000000-0000-4000-8000-000000000005','other','Synthetic transition evidence','documents/cases/42000000-0000-4000-8000-000000000005/43000000-0000-4000-8000-000000000005/synthetic.pdf','synthetic.pdf','application/pdf',100,null)$$,'owner prepares pending file before staff attempts needs_customer_info');
reset role; select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000002","role":"authenticated"}',true); set local role authenticated;
select throws_ok($$select public.transition_verification_case('42000000-0000-4000-8000-000000000005','needs_customer_info','Synthetic staff decision','')$$,'22023',null,'staff cannot move pending preparation to needs_customer_info');
reset role; select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}',true); set local role authenticated;
select is((select workflow_status from public.verification_cases where id='42000000-0000-4000-8000-000000000005'),'needs_customer_info','owner sees correct state after staff attempts needs_customer_info');
select is((select submitted_at from public.case_evidence where id='43000000-0000-4000-8000-000000000005'),null::timestamptz,'staff needs_customer_info never releases the pending file');
select is((select count(*)::int from public.verification_cases vc join public.case_evidence ce on ce.verification_case_id=vc.id where vc.id='42000000-0000-4000-8000-000000000005' and vc.workflow_status='in_review' and vc.discarded_at is null and ce.submitted_at is null),0,'staff needs_customer_info cannot strand pending evidence in review');
select lives_ok($$select public.customer_respond_to_case('42000000-0000-4000-8000-000000000005','Requested clarification supplied.','44000000-0000-4000-8000-000000000005')$$,'owner reply remains possible after rejected needs_customer_info');
select is((select workflow_status from public.verification_cases where id='42000000-0000-4000-8000-000000000005'),'in_review','only customer reply resumes after needs_customer_info');
select ok((select submitted_at is not null from public.case_evidence where id='43000000-0000-4000-8000-000000000005'),'customer reply releases file after needs_customer_info');
reset role;
insert into public.verification_cases(id,customer_user_id,created_by_user_id,site_description,area_lga,contact_preference,workflow_status)
values ('42000000-0000-4000-8000-000000000006','41000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','Synthetic staff transition closed','Kuje','email','needs_customer_info');
insert into public.case_assignments(verification_case_id,assignee_user_id,assigned_by_user_id,status)
values ('42000000-0000-4000-8000-000000000006','41000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000002','active');
insert into public.case_status_events(id,verification_case_id,actor_user_id,from_status,to_status,reason,customer_visible,event_kind)
values ('44000000-0000-4000-8000-000000000006','42000000-0000-4000-8000-000000000006','41000000-0000-4000-8000-000000000002','in_review','needs_customer_info','Please supply clarification.',true,'information_requested');
update public.verification_cases set information_request_event_id='44000000-0000-4000-8000-000000000006' where id='42000000-0000-4000-8000-000000000006';
select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}',true); set local role authenticated;
insert into storage.objects(bucket_id,name,owner_id) values ('documents','documents/cases/42000000-0000-4000-8000-000000000006/43000000-0000-4000-8000-000000000006/synthetic.pdf','41000000-0000-4000-8000-000000000001');
select lives_ok($$select public.register_case_evidence('43000000-0000-4000-8000-000000000006','42000000-0000-4000-8000-000000000006','other','Synthetic transition evidence','documents/cases/42000000-0000-4000-8000-000000000006/43000000-0000-4000-8000-000000000006/synthetic.pdf','synthetic.pdf','application/pdf',100,null)$$,'owner prepares pending file before staff attempts closed');
reset role; select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000002","role":"authenticated"}',true); set local role authenticated;
select lives_ok($$select public.transition_verification_case('42000000-0000-4000-8000-000000000006','closed','Synthetic staff decision','')$$,'staff may closed while awaiting information');
reset role; select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}',true); set local role authenticated;
select is((select workflow_status from public.verification_cases where id='42000000-0000-4000-8000-000000000006'),'closed','owner sees correct state after staff attempts closed');
select is((select submitted_at from public.case_evidence where id='43000000-0000-4000-8000-000000000006'),null::timestamptz,'staff closed never releases the pending file');
select is((select count(*)::int from public.verification_cases vc join public.case_evidence ce on ce.verification_case_id=vc.id where vc.id='42000000-0000-4000-8000-000000000006' and vc.workflow_status='in_review' and vc.discarded_at is null and ce.submitted_at is null),0,'staff closed cannot strand pending evidence in review');
select throws_ok($$select public.customer_respond_to_case('42000000-0000-4000-8000-000000000006','Requested clarification supplied.','44000000-0000-4000-8000-000000000006')$$,'22023',null,'closed cannot release evidence via a late reply');
reset role;
insert into public.verification_cases(id,customer_user_id,created_by_user_id,site_description,area_lga,contact_preference,workflow_status)
values ('42000000-0000-4000-8000-000000000007','41000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','Synthetic staff transition cancelled','Kuje','email','needs_customer_info');
insert into public.case_assignments(verification_case_id,assignee_user_id,assigned_by_user_id,status)
values ('42000000-0000-4000-8000-000000000007','41000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000002','active');
insert into public.case_status_events(id,verification_case_id,actor_user_id,from_status,to_status,reason,customer_visible,event_kind)
values ('44000000-0000-4000-8000-000000000007','42000000-0000-4000-8000-000000000007','41000000-0000-4000-8000-000000000002','in_review','needs_customer_info','Please supply clarification.',true,'information_requested');
update public.verification_cases set information_request_event_id='44000000-0000-4000-8000-000000000007' where id='42000000-0000-4000-8000-000000000007';
select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}',true); set local role authenticated;
insert into storage.objects(bucket_id,name,owner_id) values ('documents','documents/cases/42000000-0000-4000-8000-000000000007/43000000-0000-4000-8000-000000000007/synthetic.pdf','41000000-0000-4000-8000-000000000001');
select lives_ok($$select public.register_case_evidence('43000000-0000-4000-8000-000000000007','42000000-0000-4000-8000-000000000007','other','Synthetic transition evidence','documents/cases/42000000-0000-4000-8000-000000000007/43000000-0000-4000-8000-000000000007/synthetic.pdf','synthetic.pdf','application/pdf',100,null)$$,'owner prepares pending file before staff attempts cancelled');
reset role; select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000002","role":"authenticated"}',true); set local role authenticated;
select lives_ok($$select public.transition_verification_case('42000000-0000-4000-8000-000000000007','cancelled','Synthetic staff decision','')$$,'staff may cancelled while awaiting information');
reset role; select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}',true); set local role authenticated;
select is((select workflow_status from public.verification_cases where id='42000000-0000-4000-8000-000000000007'),'cancelled','owner sees correct state after staff attempts cancelled');
select is((select submitted_at from public.case_evidence where id='43000000-0000-4000-8000-000000000007'),null::timestamptz,'staff cancelled never releases the pending file');
select is((select count(*)::int from public.verification_cases vc join public.case_evidence ce on ce.verification_case_id=vc.id where vc.id='42000000-0000-4000-8000-000000000007' and vc.workflow_status='in_review' and vc.discarded_at is null and ce.submitted_at is null),0,'staff cancelled cannot strand pending evidence in review');
select throws_ok($$select public.customer_respond_to_case('42000000-0000-4000-8000-000000000007','Requested clarification supplied.','44000000-0000-4000-8000-000000000007')$$,'22023',null,'cancelled cannot release evidence via a late reply');
select * from finish();
rollback;
