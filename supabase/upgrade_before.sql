-- Disposable CI upgrade fixture ONLY. Applied after resetting LOCAL to 025.
insert into auth.users(id,aud,role,email,raw_user_meta_data) values
 ('40000000-0000-4000-8000-000000000001','authenticated','authenticated','upgrade-owner@test.invalid','{}'),
 ('40000000-0000-4000-8000-000000000002','authenticated','authenticated','upgrade-lead@test.invalid','{}');
insert into public.staff_members(user_id,department,is_lead,active) values
 ('40000000-0000-4000-8000-000000000002','Verification',true,true);
insert into public.verification_cases(id,customer_user_id,created_by_user_id,site_description,area_lga,contact_preference,workflow_status,discarded_at)
select ('50000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 '40000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',
 'Synthetic legacy upgrade case','Kuje','email',status,
 case when n=3 then now() else null end
from (values(1,'draft'),(2,'needs_customer_info'),(3,'cancelled'),(4,'cancelled'),(5,'closed')) f(n,status);
insert into public.case_evidence(id,verification_case_id,uploaded_by_user_id,evidence_type,description,storage_path,original_filename,mime_type,size_bytes)
select ('60000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 ('50000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 '40000000-0000-4000-8000-000000000001','other','Synthetic historical evidence',
 'documents/cases/50000000-0000-4000-8000-'||lpad(n::text,12,'0')||'/60000000-0000-4000-8000-'||lpad(n::text,12,'0')||'/legacy.pdf',
 'legacy.pdf','application/pdf',100 from generate_series(1,5) n;
insert into public.case_status_events(id,verification_case_id,actor_user_id,from_status,to_status,reason,customer_visible,event_kind) values
 ('70000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002','in_review','needs_customer_info','The review team needs more information from you.',true,'information_requested'),
 ('70000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002','in_review','needs_customer_info','Please clarify the old document.',true,'information_requested'),
 ('70000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001','needs_customer_info','needs_customer_info','Document added: Other',true,'status_change');
insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata) values
 ('40000000-0000-4000-8000-000000000001','case_evidence.created','case_evidence','60000000-0000-4000-8000-000000000002','{"legacy":true}');
create schema upgrade_snapshot;
create table upgrade_snapshot.history as select
 (select jsonb_agg(to_jsonb(e) order by id) from public.case_status_events e) as events,
 (select jsonb_agg(to_jsonb(a) order by id) from public.audit_logs a) as audits,
 (select jsonb_agg(to_jsonb(ce) order by id) from public.case_evidence ce) as evidence;
