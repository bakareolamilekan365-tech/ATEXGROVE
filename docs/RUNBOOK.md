# Atexgrove Operator Runbook

## Current migration baseline and historical 026 cutover

Migration 026 and its compatible application code are merged. The owner subsequently applied 026 and confirms numeric hosted history through `001`–`026`; the last independent read-only ledger check reached 025 on 2026-10-25. Do not reapply 026 to the existing hosted project, and do not claim an apply timestamp that was not recorded.

The original cutover rationale remains important history: migration 026 removed `customer_respond_to_case(uuid,text)` and required `customer_respond_to_case(uuid,text,uuid)`. The safe sequence was compatible code, paused writes, migration, new app, then separate customer/lead/assignee/unrelated-account checks. Old application builds are incompatible with the three-argument RPC. Preserve this rule for rollback and incident decisions; never roll back to an app that expects the removed signature or broadly visible evidence.

Do not roll back to an app that expects the old response RPC or broadly visible evidence. Prefer a reviewed forward fix; preserve pending data, event references and release audits. Do not reset/seed production or use privileged credentials for authorization testing.

A legacy `needs_customer_info` row without any historical request milestone has no safe request token and cannot submit. Keep its files pending; use a reviewed forward repair of the request linkage or close/cancel and create a new request. Staff cannot resume review manually. Closure/cancellation never release pending files. A stale retry from a completed round returns only the old result and does not affect the new round.


### Optional read-only hosted verification

These queries do not apply migrations. Run them only under a separately authorized read-only inspection, record actual outputs, and do not treat CI or owner confirmation as an independent ledger check:

```sql
select version, name from supabase_migrations.schema_migrations
where version in ('025', '026') order by version;

select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename in ('case_evidence', 'case_status_events', 'audit_logs'))
   or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

select to_regprocedure('public.customer_respond_to_case(uuid,text,uuid)') as required_three_arg_rpc,
       to_regprocedure('public.customer_respond_to_case(uuid,text)') as removed_two_arg_rpc;

select count(*) as evidence_pending from public.case_evidence where submitted_at is null;
select vc.workflow_status, (vc.discarded_at is not null) as discarded, count(*) as evidence_pending
from public.case_evidence ce join public.verification_cases vc on vc.id = ce.verification_case_id
where ce.submitted_at is null group by vc.workflow_status, (vc.discarded_at is not null);
```

Expected policy names include `Customers and scoped staff can read case evidence`, `Customers and scoped staff can read case status events`, `Admins can view audit logs`, and `Customers can upload evidence for their cases`. Inspect their predicates too: staff metadata and audit access must exclude pending files; uploads must require ownership and draft/awaiting-information status. There must be no authenticated Storage SELECT/UPDATE/DELETE access. The three-argument RPC must exist and the two-argument one must be NULL. Pending counts can legitimately include drafts, awaiting-information responses and retained closed/cancelled/discarded evidence, but must not include active `in_review` cases. Run authenticated account smoke checks as well; privileged counts alone do not test RLS.


This runbook covers current development and hosted-configuration procedures. It does not authorize unreviewed production changes. Use synthetic data only.

## Owner-request intake and delivery rule

Owner requests do not move directly from chat into implementation. Record each request in [BACKLOG.md](BACKLOG.md), identify its source, and triage it as now, next or later before starting work. Keep one scoped backlog item in progress per feature branch. Database migrations and security changes must use the normal review and CI loop; never apply them to hosted Supabase just because a request was received.

## Apply reviewed Supabase migrations

For the future **separate Supabase Free staging project only**, run these commands from the repository root after its exact project reference has been approved. Stop if the displayed linked reference is not the isolated staging project. Never use this block against the existing hosted project:

```powershell
npx supabase login
npx supabase link --project-ref <APPROVED_STAGING_PROJECT_REF>
npx supabase migration list
npx supabase db push --dry-run
npx supabase db push
npx supabase migration list
```

Before the real staging `db push`, verify the dry run lists the reviewed sequence through `026_pending_evidence_submission.sql`, database CI is green, and the linked target is the approved staging ref. Never edit an already-applied migration; add a forward migration. No command in this runbook authorizes mutation of the existing hosted project.

## Add or update a staff member

Staff provisioning is a controlled database-operator action. First create or identify the Auth user in the Supabase dashboard, then run SQL like the following in the Supabase SQL Editor:

```sql
insert into public.staff_members (user_id, department, is_lead, active)
values ('<AUTH_USER_UUID>'::uuid, 'Verification', false, true)
on conflict (user_id) do update
set department = excluded.department,
    is_lead = excluded.is_lead,
    active = excluded.active;
```

Allowed departments are `Verification`, `Feasibility` and `Operations`. Only one active lead is allowed per department. Confirm the intended department and lead status before running the statement. Never commit, paste into documentation or share a real user UUID in chat.

## Required local environment variables

Create `.env.local` locally and keep it out of git:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` holds the client-safe publishable key used by this repository. `SUPABASE_SERVICE_ROLE_KEY` is server-only: never expose it to browser code, commit it, place it in documentation or paste it into chat. Rotate a privileged credential if it is exposed.

## November direct evidence upload operations

Expected path: `browser -> authenticated private Supabase Storage -> metadata-only server finalization -> register_case_evidence`. Evidence bytes must not pass through the Next.js/Netlify function. The browser uses the customer session and migration 026 INSERT RLS. The server may use the service role only for the global exact-reference check and authoritative stored-object verification; finalization never deletes the browser-supplied path.

Troubleshoot by phase:

- **Storage upload failure:** no finalization call should occur. Check the signed-in customer, owned case state, generated `documents/cases/...` path, bucket MIME/size limits and Storage/RLS logs.
- **Server verification failure:** the object uploaded, but authoritative metadata, exact path binding, HTTP Range or magic-byte validation failed. The server logs a minimal reason code plus case/evidence IDs and leaves the object unchanged.
- **Evidence registration failure:** stored-object validation passed, but `register_case_evidence` rejected current ownership/state, quota or version lineage. The server records a minimal diagnostic and leaves the object unchanged. The UNIQUE path constraint remains the final concurrent-duplicate guard.
- **Orphaned unregistered object:** an object exists in private Storage with no exact `case_evidence.storage_path` match, normally because the browser stopped or finalization rejected it. It is not registered evidence and is not staff-visible through the evidence workflow.

### Conservative manual orphan cleanup

For the November preview, reconciliation is operator-controlled; there is no scheduler or automatic expiry. An authorized operator may first list conservative candidates with this read-only query. It returns internal object IDs, timestamps and non-sensitive metadata, not customer filenames, document contents or object paths:

```sql
select
  o.id as storage_object_id,
  o.created_at,
  o.updated_at,
  case
    when coalesce(o.metadata ->> 'size', '') ~ '^[0-9]+$'
      then (o.metadata ->> 'size')::bigint
    else null
  end as size_bytes,
  coalesce(o.metadata ->> 'mimetype', o.metadata ->> 'contentType') as mime_type
from storage.objects o
where o.bucket_id = 'documents'
  and o.name ~* '^documents/cases/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|jpg|png)$'
  and o.created_at < now() - interval '24 hours'
  and not exists (
    select 1
    from public.case_evidence ce
    where ce.storage_path = o.name
  )
order by o.created_at asc;
```

For each candidate, complete every step below; never approve a prefix, batch or speculative deletion:

1. An authorized operator records the candidate internal object ID and its age of at least 24 hours.
2. The repository owner gives explicit approval for that one candidate deletion.
3. Immediately before deletion, the operator performs a fresh lookup by object ID and confirms `registered = false`:

   ```sql
   select
     o.id as storage_object_id,
     o.bucket_id,
     o.name as exact_storage_object_path,
     o.created_at,
     exists (
       select 1
       from public.case_evidence ce
       where ce.storage_path = o.name
     ) as registered
   from storage.objects o
   where o.id = '<APPROVED_STORAGE_OBJECT_UUID>'::uuid
     and o.bucket_id = 'documents';
   ```

4. Stop if the row is absent, `registered` is true, the path is malformed, or any case/evidence record references the path. Registered evidence must never be deleted.
5. Confirm with the tester/operator that no upload or finalization for this object is still in progress.
6. Delete only that exact path through the authorized Supabase Storage API or Dashboard Storage action. Never run `DELETE` against `storage.objects`, never grant customer DELETE permission, and never delete by filename similarity, case prefix or age alone.
7. Record a sanitized operational entry containing approval, operator, internal object ID, timestamp, reason and outcome. Do not copy the object path, original filename, contents, tokens or credentials into the record.

Candidate status and an empty exact-reference result are necessary but not sufficient; complete every approval and in-progress check above. Durable reservations, automated expiry, upload reservations and stronger quota concurrency protection remain deferred.

### Staging acceptance for direct uploads

In the isolated staging environment, use synthetic/redacted fixtures and separate customer/staff accounts. Record browser, runtime, timestamps and outcomes for:

1. valid PDF uploads around 1 MiB, 5 MiB, 9 MiB and just under 10 MiB;
2. valid JPEG/PNG near 9-10 MiB where practical;
3. zero-byte, oversized, unsupported extension/MIME and MIME/signature mismatch rejection;
4. interruption after Storage upload but before finalization, followed by the manual orphan check;
5. wrong customer, ineligible case state, malformed/cross-case path and stale replacement rejection;
6. pending evidence invisibility to staff before explicit submission/reply;
7. staff visibility after release and a 60-second audited attachment download;
8. repeated clicks/retries without overwrite, duplicate registration or false success.

Do not approve preview invitations until a real permitted 9-10 MiB file succeeds through deployed Netlify plus isolated Supabase staging. If standard direct upload is unreliable, review TUS next rather than silently reducing the 10 MiB limit.

## Local setup and troubleshooting

After pulling changes:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000/register` to create a test account or `http://localhost:3000/login` to sign in.

If Next.js reports `Cannot find module` for a generated chunk, stop the development server, delete the local `.next` directory, then restart:

```powershell
Remove-Item -LiteralPath .next -Recurse -Force
npm run dev
```

Only delete the repository-local `.next` build cache. Do not delete source or dependency directories as part of this fix.

## Reset a forgotten application password

1. Open `/forgot-password` from the application or use **Forgot your password?** on `/login`.
2. Enter the account email and submit. The response remains generic and does not reveal whether an account exists.
3. Open the Supabase recovery email on the same trusted device/browser.
4. The callback should exchange the recovery code and send the user to `/update-password`.
5. Enter and confirm the new password, then sign in again.

If the link is expired or invalid, request a new recovery email. Do not invent or manually copy recovery tokens. Hosted redirect, expiry and error behavior still requires complete operational verification; see [STATUS.md](STATUS.md).

## Switch accounts while testing

Use the **Sign out** button in the customer dashboard or staff workspace, then sign in with the other synthetic test account. A private/incognito browser window is an alternative when you need to keep two test accounts signed in at once. Do not use real customer data for account-isolation tests.

## Deploying incompatible RPC signature changes

For a migration that drops an RPC signature used by the current app, deploy in this order: **merge the compatible code first, apply the migration second, then run the new app build**. Do not run an older app build against the new schema during the transition.

Migrations `021` and `022` replace RPC signatures: `021` drops the old `create_verification_case` signature; `022` drops the previous `create_verification_case` and `assign_verification_case` signatures. An older app build still calling those signatures will fail after the corresponding migration is applied. Migration 022 was applied to hosted Supabase on 2026-10-23; migration 023 was applied after PR #26 merged (per owner confirmation); and `supabase migration list --linked` observed migrations `001`–`024` on 2026-10-23. The exact apply date for 024 is not available from the ledger. Apply future migrations only to the intended environment after the compatible code is ready.

Migration `023_draft_case_with_uploads.sql` and migration `024_case_intake_and_consent.sql` replaced older creation/submission RPC signatures. The controlled deployment window for 024 is historical: the linked hosted migration ledger now records 024. Historical deployment note for 025: it did not change RPC signatures; it added an event kind and a unique evidence-version successor guard. Migration 025 is hosted as independently verified 2026-10-25, and migration 026 is subsequently owner-confirmed hosted. Do not reapply either migration to the existing hosted project.

For future incompatible RPC changes, prefer adding versioned/new RPC names first, move the application to them, then remove old signatures in a later migration. When that is not practical, pause the affected workflow and use a controlled maintenance/deployment window; never imply that incompatible old and new versions are simultaneously supported.

### Migration 022 location preflight

Before adding the council check, migration 022 normalizes only the known legacy value `Kwali LGA` to `Kwali`, then runs a preflight over `verification_cases`. Clean data passes; a `Kwali LGA` row passes after that normalization. Any other unsupported value (including NULL) aborts the migration before the check is added. The exception lists each distinct offending value and its row count and instructs the operator to normalize it through a reviewed migration or manual fix before retrying. Do not infer or apply any other mapping. After a successful migration, the pgTAP suite verifies clean data and the normalized `Kwali` value. If the preflight aborts, review the reported values and resolve them explicitly before retrying.
