-- Behavioural allow/deny tests for Phase 2, Slice 2.
-- Runs only against the disposable local/CI Supabase database.
begin;
select plan(55);

select ok((select relrowsecurity from pg_class where oid = 'public.case_evidence'::regclass), 'case_evidence has RLS enabled');
select ok(not (select public from storage.buckets where id = 'documents'), 'documents bucket is private');
select is((select file_size_limit from storage.buckets where id = 'documents'), 10485760::bigint, 'documents bucket has a 10 MB limit');
select is((select allowed_mime_types from storage.buckets where id = 'documents'), array['application/pdf', 'image/jpeg', 'image/png']::text[], 'documents bucket has an explicit MIME allowlist');
select ok(not has_function_privilege('anon', 'public.document_case_id_from_path(text)', 'EXECUTE'), 'path helper is not callable by anon');
select ok(not has_function_privilege('anon', 'public.document_evidence_id_from_path(text)', 'EXECUTE'), 'evidence path helper is not callable by anon');
select ok(not has_function_privilege('anon', 'public.register_case_evidence(uuid,uuid,text,text,text,text,text,bigint,uuid)', 'EXECUTE'), 'registration RPC is not callable by anon');
select ok(not has_function_privilege('anon', 'public.customer_respond_to_case(uuid,text)', 'EXECUTE'), 'customer response RPC is not callable by anon');
select ok(not has_function_privilege('anon', 'public.authorize_case_evidence_download(uuid)', 'EXECUTE'), 'download authorization RPC is not callable by anon');

insert into auth.users (id, aud, role, email, raw_user_meta_data) values
  ('a1100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'evidence-customer-a@test.invalid', '{}'),
  ('b2200000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'evidence-customer-b@test.invalid', '{}'),
  ('c3300000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'evidence-lead@test.invalid', '{}'),
  ('d4400000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'evidence-assignee@test.invalid', '{}'),
  ('e5500000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'evidence-other-lead@test.invalid', '{}'),
  ('f6600000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', 'evidence-unassigned@test.invalid', '{}');

insert into public.staff_members (user_id, department, is_lead, active) values
  ('c3300000-0000-4000-8000-000000000003', 'Verification', true, true),
  ('d4400000-0000-4000-8000-000000000004', 'Verification', false, true),
  ('e5500000-0000-4000-8000-000000000005', 'Operations', true, true),
  ('f6600000-0000-4000-8000-000000000006', 'Verification', false, true);

insert into public.verification_cases (
  id, customer_user_id, created_by_user_id, site_description, area_lga,
  customer_notes, contact_preference, workflow_status
) values
  ('11111111-1111-4111-8111-111111111111', 'a1100000-0000-4000-8000-000000000001', 'a1100000-0000-4000-8000-000000000001', 'DEMO DATA / NOT OFFICIAL evidence case A', 'Kuje', 'Synthetic only', 'email', 'in_review'),
  ('22222222-2222-4222-8222-222222222222', 'b2200000-0000-4000-8000-000000000002', 'b2200000-0000-4000-8000-000000000002', 'DEMO DATA / NOT OFFICIAL evidence case B', 'Gwagwalada', 'Synthetic only', 'email', 'needs_customer_info');

insert into public.case_assignments (
  verification_case_id, assignee_user_id, assigned_by_user_id, status
) values (
  '11111111-1111-4111-8111-111111111111',
  'd4400000-0000-4000-8000-000000000004',
  'c3300000-0000-4000-8000-000000000003',
  'active'
);

select set_config('request.jwt.claims', '{"sub":"a1100000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('documents', 'documents/cases/11111111-1111-4111-8111-111111111111/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/random.pdf', 'a1100000-0000-4000-8000-000000000001')$$,
  'customer can upload an allowed object under their open case path'
);
select lives_ok(
  $$select public.register_case_evidence(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'title_deed_copy',
    'Synthetic title deed copy',
    'documents/cases/11111111-1111-4111-8111-111111111111/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/random.pdf',
    'synthetic-title.pdf',
    'application/pdf',
    1024,
    null
  )$$,
  'owner can register uploaded evidence'
);
reset role;

select is((select count(*)::int from public.case_evidence where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1, 'registration writes the evidence row');
select is((select count(*)::int from public.case_status_events where reason = 'Document added: Title deed copy'), 1, 'registration writes the customer-visible event');
select is((select count(*)::int from public.audit_logs where action = 'case_evidence.created' and entity_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1, 'registration writes the audit row');
select is(
  (select source || ':' || review_state || ':' || is_demo_data::text || ':' || version::text from public.case_evidence where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'customer_supplied:received_unreviewed:true:1',
  'evidence starts customer-supplied, unreviewed, demo-labelled and versioned'
);

select set_config('request.jwt.claims', '{"sub":"a1100000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.case_evidence), 1, 'customer A reads their own evidence');
reset role;

select set_config('request.jwt.claims', '{"sub":"b2200000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.case_evidence), 0, 'customer B cannot read customer A evidence');
select is((select count(*)::int from storage.objects where bucket_id = 'documents'), 0, 'customer B cannot read customer A object');
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('documents', 'documents/cases/11111111-1111-4111-8111-111111111111/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/wrong.pdf', 'b2200000-0000-4000-8000-000000000002')$$,
  '42501', null, 'customer B cannot upload to customer A case path'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"e5500000-0000-4000-8000-000000000005","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.case_evidence), 0, 'staff lead outside the case department cannot read evidence');
select is((select count(*)::int from storage.objects where bucket_id = 'documents'), 0, 'staff lead outside the case department cannot read objects');
reset role;

select set_config('request.jwt.claims', '{"sub":"f6600000-0000-4000-8000-000000000006","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.case_evidence), 0, 'unassigned non-lead staff cannot read evidence');
reset role;

select set_config('request.jwt.claims', '{"sub":"c3300000-0000-4000-8000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.case_evidence), 1, 'department lead can read case evidence');
select is((select count(*)::int from storage.objects where bucket_id = 'documents'), 0, 'department lead cannot read evidence objects directly');
reset role;

select set_config('request.jwt.claims', '{"sub":"d4400000-0000-4000-8000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.case_evidence), 1, 'active assignee can read case evidence');
select is((select count(*)::int from storage.objects where bucket_id = 'documents'), 0, 'active assignee cannot read evidence objects directly');
reset role;

select set_config('request.jwt.claims', '{"sub":"a1100000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select throws_ok($$update public.case_evidence set description = 'tampered' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$, '42501', null, 'customer cannot update evidence rows');
select throws_ok($$delete from public.case_evidence where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$, '42501', null, 'customer cannot delete evidence rows');
select results_eq(
  $$update storage.objects set name = name || '.changed' where name like 'documents/cases/11111111%' returning name$$,
  ARRAY[]::text[],
  'customer evidence-object update is a no-op and leaves the object unchanged'
);
select throws_ok($$delete from storage.objects where name like 'documents/cases/11111111%'$$, '42501', null, 'customer cannot delete evidence objects');
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('documents', 'documents/cases/not-a-uuid/nope/file.pdf', 'a1100000-0000-4000-8000-000000000001')$$,
  '42501', null, 'malformed object paths are denied without leaking cast errors'
);
reset role;

insert into storage.objects (bucket_id, name, owner_id) values
  ('documents', 'documents/cases/11111111-1111-4111-8111-111111111111/cccccccc-cccc-4ccc-8ccc-cccccccccccc/bad.html', 'a1100000-0000-4000-8000-000000000001'),
  ('documents', 'documents/cases/11111111-1111-4111-8111-111111111111/dddddddd-dddd-4ddd-8ddd-dddddddddddd/large.pdf', 'a1100000-0000-4000-8000-000000000001');

select set_config('request.jwt.claims', '{"sub":"a1100000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$select public.register_case_evidence('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '11111111-1111-4111-8111-111111111111', 'other', 'Invalid HTML', 'documents/cases/11111111-1111-4111-8111-111111111111/cccccccc-cccc-4ccc-8ccc-cccccccccccc/bad.html', 'bad.html', 'text/html', 200, null)$$,
  '22023', 'Unsupported file type', 'disallowed MIME registration is rejected'
);
select is((select count(*)::int from public.case_evidence where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'), 0, 'disallowed MIME leaves no evidence row');
select throws_ok(
  $$select public.register_case_evidence('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '11111111-1111-4111-8111-111111111111', 'other', 'Oversized PDF', 'documents/cases/11111111-1111-4111-8111-111111111111/dddddddd-dddd-4ddd-8ddd-dddddddddddd/large.pdf', 'large.pdf', 'application/pdf', 10485761, null)$$,
  '22023', 'File must be no larger than 10 MB', 'oversized registration is rejected'
);
select is((select count(*)::int from public.case_evidence where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'), 0, 'oversized registration leaves no evidence row');
reset role;

select set_config('request.jwt.claims', '{"sub":"b2200000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$select public.register_case_evidence('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '11111111-1111-4111-8111-111111111111', 'other', 'Cross customer attempt', 'documents/cases/11111111-1111-4111-8111-111111111111/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/file.pdf', 'file.pdf', 'application/pdf', 20, null)$$,
  '42501', 'Only the case customer can add evidence', 'another customer cannot register evidence'
);
reset role;
select is((select count(*)::int from public.case_evidence where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'), 0, 'failed registration leaves no evidence row');
select is((select count(*)::int from public.case_status_events where reason = 'Document added: Other' and actor_user_id = 'b2200000-0000-4000-8000-000000000002'), 0, 'failed registration leaves no event');
select is((select count(*)::int from public.audit_logs where entity_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'), 0, 'failed registration leaves no audit row');

insert into public.case_evidence (
  id, verification_case_id, uploaded_by_user_id, evidence_type, description,
  storage_path, original_filename, mime_type, size_bytes
)
select gen_random_uuid(), '11111111-1111-4111-8111-111111111111', 'a1100000-0000-4000-8000-000000000001',
  'other', 'Synthetic count fixture', 'documents/cases/11111111-1111-4111-8111-111111111111/' || gen_random_uuid()::text || '/fixture.pdf',
  'fixture.pdf', 'application/pdf', 20
from generate_series(1, 9);
select set_config('request.jwt.claims', '{"sub":"a1100000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('documents', 'documents/cases/11111111-1111-4111-8111-111111111111/ffffffff-ffff-4fff-8fff-ffffffffffff/eleventh.pdf', 'a1100000-0000-4000-8000-000000000001')$$,
  '42501', null, 'storage policy rejects an eleventh object after ten registered files'
);
reset role;

-- A privileged fixture insert lets the RPC count guard be tested independently
-- of the Storage policy. Application code never performs this insert directly.
insert into storage.objects (bucket_id, name, owner_id) values
  ('documents', 'documents/cases/11111111-1111-4111-8111-111111111111/ffffffff-ffff-4fff-8fff-ffffffffffff/eleventh.pdf', 'a1100000-0000-4000-8000-000000000001');

select set_config('request.jwt.claims', '{"sub":"a1100000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$select public.register_case_evidence('ffffffff-ffff-4fff-8fff-ffffffffffff', '11111111-1111-4111-8111-111111111111', 'other', 'Eleventh file', 'documents/cases/11111111-1111-4111-8111-111111111111/ffffffff-ffff-4fff-8fff-ffffffffffff/eleventh.pdf', 'eleventh.pdf', 'application/pdf', 20, null)$$,
  '22023', 'A case can have at most 10 files', 'eleventh file is rejected'
);
reset role;
select is((select count(*)::int from public.case_evidence where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'), 0, 'eleventh file leaves no evidence row');

select set_config('request.jwt.claims', '{"sub":"a1100000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$select public.customer_respond_to_case('22222222-2222-4222-8222-222222222222', 'Wrong customer response')$$,
  '42501', 'Only the case customer can respond', 'another customer cannot respond'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"d4400000-0000-4000-8000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$select public.customer_respond_to_case('22222222-2222-4222-8222-222222222222', 'Staff response attempt')$$,
  '42501', 'Only the case customer can respond', 'staff cannot use the customer response RPC'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"b2200000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$select public.customer_respond_to_case('22222222-2222-4222-8222-222222222222', 'Synthetic clarification supplied.')$$,
  'case owner can respond while information is needed'
);
reset role;
select is((select workflow_status from public.verification_cases where id = '22222222-2222-4222-8222-222222222222'), 'in_review', 'customer response resumes review');
select is((select count(*)::int from public.case_status_events where verification_case_id = '22222222-2222-4222-8222-222222222222' and customer_visible), 2, 'customer response writes the fixed update and the customer text as visible events');

update public.verification_cases set workflow_status = 'closed' where id = '11111111-1111-4111-8111-111111111111';
select set_config('request.jwt.claims', '{"sub":"a1100000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('documents', 'documents/cases/11111111-1111-4111-8111-111111111111/12345678-1234-4234-8234-123456789012/closed.pdf', 'a1100000-0000-4000-8000-000000000001')$$,
  '42501', null, 'customer cannot upload while case is closed'
);
reset role;

update public.verification_cases set workflow_status = 'cancelled' where id = '22222222-2222-4222-8222-222222222222';
select set_config('request.jwt.claims', '{"sub":"b2200000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('documents', 'documents/cases/22222222-2222-4222-8222-222222222222/23456789-2345-4345-8345-234567890123/cancelled.pdf', 'b2200000-0000-4000-8000-000000000002')$$,
  '42501', null, 'customer cannot upload while case is cancelled'
);
reset role;

set local role anon;
select throws_ok($$select count(*) from public.case_evidence$$, '42501', null, 'anonymous user cannot select evidence rows');
select is((select count(*)::int from storage.objects where bucket_id = 'documents'), 0, 'anonymous user cannot read evidence objects');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('documents', 'documents/cases/11111111-1111-4111-8111-111111111111/34567890-3456-4456-8456-345678901234/anon.pdf')$$,
  '42501', null, 'anonymous user cannot upload evidence objects'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"e5500000-0000-4000-8000-000000000005","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$select * from public.authorize_case_evidence_download('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')$$,
  '42501', 'Staff access to this case is required', 'out-of-scope staff cannot authorize a download'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"c3300000-0000-4000-8000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$select * from public.authorize_case_evidence_download('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')$$,
  'scoped lead can authorize a download'
);
reset role;
select is((select count(*)::int from public.audit_logs where action = 'document.accessed' and entity_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1, 'authorized download writes an access audit');

select * from finish();
rollback;
