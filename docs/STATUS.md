# Atexgrove Current Status

**Status date:** 2026-10-27

**Authority:** This file is the single source of truth for current implementation, hosted deployment, automated evidence and open operational verification. Architecture documents describe intended boundaries; dated audit and engineering-log sections remain historical.

## Current baseline — migration 026 and private preview

- **Implemented and merged:** PR #29 added `026_pending_evidence_submission.sql` and compatible application behavior. PR #30 normalized the repository filenames for migrations 025 and 026; migration 025's hosted history marker was changed to numeric `025` on 2026-10-25 without rerunning its SQL.
- **Owner-confirmed hosted:** after the last documented read-only check through 025, the owner applied migration 026 and confirmed that hosted migration history now uses numeric versions `001`–`026`. This is a subsequent owner-confirmed fact, not a fresh independent ledger inspection; no apply date or time is claimed.
- **CI-verified:** app run [40194071878](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40194071878) passed lint, typecheck, 75 unit tests, 26 integration tests (3 credential-gated skips), guardrails and build. Database run [40194071685](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40194071685) passed 10 pgTAP suites / 494 assertions plus 13 real 025-to-026 upgrade assertions (507 total) in disposable infrastructure. This does not prove hosted behavior.
- **Latest green merged-baseline evidence:** PR #30 app run [40222378896](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40222378896) passed install, lint, typecheck, unit/integration tests, guardrails and build. Database run [40222378897](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40222378897) applied migrations 001–026 on disposable Supabase, passed 10 pgTAP files / 494 assertions and the 13-assertion 025-to-026 upgrade test. These runs validate the merged repository, not hosted deployment.
- **Private preview decision:** the provisional 12–20 November 2026 closed test targets approximately 15–20 approved owners and board members using fictional data and individual accounts. The Google access-request form has been distributed. Staging, account provisioning and browser acceptance are not yet complete.
- **Hosting decision:** use Netlify Free for the Next.js application and a separate Supabase Free staging project, with GitHub for source/CI and Google Forms/Sheets for access requests and feedback. The budget is strictly ₦0 / $0. No Netlify or staging deployment is claimed.
- **January 2027, not November acceptance:** Staff ID/password, possible authenticator MFA, separate staff/customer identities, employee customer-access controls and conflict-of-interest safeguards remain a later workstream.

Operational gates still open: realistic multi-account isolation, real browser authentication transitions, hosted email confirmation/recovery edge cases, complete preview journeys and Netlify runtime compatibility. Netlify's buffered function boundary is not used for evidence bytes by the direct-upload repository implementation described below. A permitted 9-10 MiB upload must still pass through deployed Netlify plus isolated Supabase staging before invitations.

The current CI workflow uses Node 20 while installed Supabase JavaScript packages declare Node 22 or later; the latest run passed but emitted engine warnings. Align CI and the eventual Netlify runtime with a supported Node version in a separate reviewed change. The same run reported dependency vulnerabilities during installation; review and triage them without an automatic forced major-version upgrade.

## November direct evidence upload - repository implementation (2026-10-27)

**Before this implementation:** evidence bytes travelled `browser -> Next.js Server Action -> Supabase Storage`. That path could not reliably carry the permitted 9-10 MiB files through Netlify Free's buffered function limit.

**Implemented on `fix/direct-evidence-upload`; CI and staging evidence pending:** the repository path is now `browser -> authenticated private Supabase Storage upload -> metadata-only Next.js finalization action -> existing register_case_evidence RPC`. The browser performs an early signature check for user feedback; the server then validates ownership, eligible case state, exact case/evidence/path binding, authoritative Storage metadata and a Range-fetched 8-byte signature prefix before registration. Failed verification or registration triggers best-effort server-only cleanup. Pending-evidence and staff-invisibility behavior from migration 026 is unchanged.

- No schema migration was added; hosted migrations remain owner-confirmed `001`-`026`.
- No hosted database or Storage mutation was performed by this implementation task. A read-only check confirmed that the existing private-object endpoint returned HTTP 206, `Content-Range: bytes 0-7/...`, and exactly eight bytes for an existing object; Storage `info()` matched bucket, path, size and MIME.
- No Netlify deployment or staging environment was created. Repository tests cannot prove real 9-10 MiB staging reliability.
- Standard authenticated Supabase upload is used. TUS remains the next reviewed transport if deployed 9-10 MiB testing is unreliable.
- A browser disconnect after direct upload can leave an unregistered private object. Preview cleanup is manual and conservative; automatic reservation/expiry cleanup is deferred.
- The registered-evidence limit remains authoritative in `register_case_evidence`; simultaneous unregistered uploads are not reservation-counted. This is an accepted small-cohort preview limitation, not production readiness.

## Login/session navigation correction (2026-10-27)

**Implemented on `fix/login-session-and-docs-reconciliation`; browser acceptance pending:** successful email/password sign-in now makes one full-document request to a validated internal `?next=` destination or `/dashboard`. This avoids racing `router.push` with an immediate refresh across the authentication boundary. Customer/staff workspace boundary links use the same fresh-request principle. Middleware preserves refreshed Supabase cookies and cache-control headers when returning redirects.

Unit coverage exercises successful/failed sign-in navigation and unsafe redirect inputs; integration coverage exercises protected-route redirects and refreshed-cookie propagation. The reported browser symptom was not independently reproduced against a safe isolated authentication environment, so immediate login, recovery completion, sign-out, account switching and customer/staff navigation remain operational verification items. No hosted Supabase state or deployment was changed.

## Historical branch correction — pending evidence submission (2026-10-25; superseded above)

Hosted ledger checked read-only on 2026-10-25: migrations `001`–`025`. PR #28 is merged and 025 is hosted. Earlier dated statements below describe the state when written and are superseded by this section for current state.

The repository includes forward-only `026_pending_evidence_submission.sql`, merged in PR #29. It is **CI-verified and not hosted**. Evidence registration writes metadata and an audit, not a case milestone. Each file remains pending (`submitted_at IS NULL`) until owner submission releases it. Staff evidence RLS and audited downloads require a submitted timestamp plus existing case scope. Draft and discarded-draft protections remain. Old visible evidence remains available; draft/discarded evidence remains pending.

The customer prepares files only during draft or `needs_customer_info`; after submission they must wait for a staff request. Staff cannot resume an awaiting-information case; only the customer reply resumes review, while closure/cancellation keep pending files private. The generic upload form starts with an empty required document-type placeholder; replacement mode is unavailable until a type is chosen. Explicit request/response submission releases all pending versions together; response submission writes one milestone containing the required message. A request-event token and uniqueness guard make retries harmless across later information rounds. Document history retains versions, upload dates and release state; the main timeline filters upload activity and unambiguous historical duplicate response lines without deleting records.

Validation is recorded in PR #29 and the dated engineering-log entry. This migration-name correction does not apply migration 026 or deploy application code.


**Historical snapshot date:** 2026-10-25. Statements in this section that migration 026 was not hosted were accurate at that time and are superseded by the current baseline above.


**Verified follow-up revision `29d31036b2a4a8208bafbc8cfc7cc4a5083d4def`:** [App CI 40194071878](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40194071878) passed lint, typecheck, **75 unit tests**, **26 integration tests** (3 existing credential-gated skips), security guardrails and production build. [Database CI 40194071685](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40194071685) passed **10 pgTAP suites / 494 assertions** on the full disposable Supabase stack and **13 actual 025 → 026 upgrade assertions**, **507 database assertions total**. Authenticated owner/assignee tests exhaust every staff destination while evidence is pending, reject resumption, preserve terminal privacy and prove customer replies release files before review resumes. Migration 026 remains **not hosted**; migrations 001–025 are unchanged. No merge, deployment or hosted migration was performed.

**Prior baseline verification (does not cover the latest follow-up patch), code commit `18cc17b99469ba2915b51a301dccc0aff4c7b7e2`:** [App CI 40176136069](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40176136069) passed lint, typecheck, 70 unit tests, 26 integration tests (3 existing credential-gated skips), security guardrails and production build. [Database CI 40176136055](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40176136055) passed all nine regular pgTAP suites (436 assertions), then reset its disposable LOCAL database to 025, seeded historical fixtures, applied the real 026 file and passed 13 upgrade assertions: **449 database assertions total**. Tests exercise authenticated owners, leads, assignees, scoped application admins and out-of-scope users. Local Playwright completed with four existing placeholder tests skipped; this is not full browser acceptance evidence. No hosted migration, merge or deployment was performed.

## Current hosted state

- **Current / owner-confirmed hosted:** migration history is consistent through numeric versions `001`–`026`. The last independent read-only ledger inspection reached 025 on 2026-10-25; the later 026 application is owner-confirmed and has no claimed apply timestamp.
- **Current / hosted:** the `documents` bucket is private, has a 10 MB object limit and allows only PDF, JPEG and PNG MIME types.
- **Current / hosted:** `storage.objects` has exactly one Atexgrove policy for the `documents` bucket: authenticated customers may insert into an owned, eligible case path. There is no authenticated object SELECT, UPDATE or DELETE policy.
- **Current / hosted:** staff downloads must first pass the audited `authorize_case_evidence_download` RPC. Only the server-side admin client, using the server-only service-role credential, creates the 60-second signed download URL.

These hosted configuration observations do not prove realistic multi-account behavior through the application.

## Migration 022 — implemented, CI-verified and hosted

- **Implemented on `fix/assignment-events-location-and-contact`:** migration 022 replaces assignment notes with a fixed customer event plus a private staff note; adds structured FCT council/area/address fields and optional consented phone contact; and adds POST sign-out for customer/staff views. Protected responses are marked `private, no-store`.
- **Follow-up fixes in PR #24:** migration 022 normalizes the legacy `Kwali LGA` council value before adding its `NOT VALID` check, and assignment now blocks both assigning a case to its customer and a customer acting as the assigning lead. A unit test checks that the SQL and TypeScript starter-area lists stay identical; old cases tolerate missing area/address values.
- **Local verification on 2026-10-23:** lint, typecheck, 36 unit tests, 14 integration tests (3 credential-gated skips), security guardrails and production build passed. The six pgTAP suites (191 assertions) passed in disposable Supabase CI; Docker is not installed locally.
- **CI evidence:** [CI run 39909627609](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39909627609) passed lint, typecheck, 36 unit tests, 14 integration tests (3 skipped), guardrails and production build. [Database security run 39909627678](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39909627678) successfully started Supabase and passed all six pgTAP suites (191 assertions). Migration 022 was separately applied to hosted Supabase as recorded below.
- **Hosted at that deployment:** migration 022 was applied to hosted Supabase on 2026-10-23; at that point migration history was `001`–`022`. Migration 023 was subsequently applied after PR #26 merged, per owner confirmation.
- **Not included:** no idle timeout is implemented; the timeout policy remains undecided.

## Current branch work — case-form UX

- **Implemented on `fix/case-form-ux`:** shared listed-value council/area selects with keyboard navigation and hidden-input submission; field-specific accessible validation errors that preserve entries; application-side 10-character address minimum (database minimum remains 3); and explicit wording for legacy cases with no detailed location. No schema, migration, or hosted changes are included.
- **CI-verified:** [CI run 39944706900](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39944706900) passed lint, typecheck, 39 unit tests, 14 integration tests (3 skipped), security guardrails and production build. [Database security run 39944706867](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39944706867) passed all 6 pgTAP suites (191 assertions) on a disposable Supabase stack.
- **Hosted:** not applicable to this UI-only change; hosted database state is unchanged.

## Current repository brand assets

The owner-confirmed Atexgrove logo, mark and wordmark SVGs are in `public/logo`. The mark is used in the staff header and as `src/app/icon.svg`.

## Current merged feature — draft-first case uploads and customer cancellation

- **Implemented on `feat/draft-case-with-uploads`:** migration 023 changes new requests to start as private drafts, allows the customer to add evidence before submission, and adds submit, discard-draft and open-case cancellation RPCs and UI. Staff scope excludes active drafts and owner-discarded drafts through the structured `discarded_at` marker, including their events and evidence; evidence downloads remain audited. `discarded_at` is nullable and means only that the customer discarded an unsubmitted draft. Ordinary customer cancellation and submission leave it null. Discarded draft records and evidence remain retained pending a separate retention/deletion decision.
- **CI-verified:** [CI run 39950544017](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39950544017) passed lint, typecheck, 40 unit tests, 17 integration tests (3 skipped), security guardrails and production build. [Database security run 39950544756](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39950544756) applied migrations through 023 on a disposable Supabase stack and passed all seven pgTAP suites (250 assertions).
- **Hosted:** migration 023 has since been applied per owner confirmation. The later linked migration ledger check confirms current hosted history through `024`.
- **Retention:** discarded draft records and uploaded files are kept; retention/cleanup and customer deletion of draft evidence are not implemented.

## Current merged feature — case intake and consent (migration 024)

- **Implemented and hosted:** migration 024 adds intake claim fields, submission-time case numbers, case-scope consent, customer next-action guidance and evidence checklist guidance. Intake values are claims, not verification. Annual numbering restarts each Africa/Lagos year with deterministic per-year backfill; representation validation rejects the contradictory self/representing combination; draft copy distinguishes Saved from Received.
- **CI-verified:** [App run 39961078177](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39961078177) passed lint, typecheck, 47 unit tests, 19 integration tests (3 skipped), security guardrails and production build. [Database run 39961078498](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39961078498) passed all 8 pgTAP suites (303 assertions) against disposable Supabase.
- **Hosted:** migration 024 appears in the linked hosted ledger checked on 2026-10-23; the exact apply date is not exposed by the ledger.

## Merged predecessor — case timeline and evidence workflow (migration 025)

- **Implemented on `fix/case-timeline-evidence-workflow`:** evidence uploads receive a `document_uploaded` event kind; customer response writes distinct ordered status and reply events; safe timeline headings classify legacy events without rewriting history; version replacement is limited to the current same-case, same-type chain head; intake claim values use centralized readable labels.
- **CI-verified:** [App CI run 39974685742](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39974685742) passed lint, typecheck, 53 unit tests, 23 integration tests (3 skipped), security guardrails and production build. [Database security run 39974685721](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39974685721) passed all 8 pgTAP suites (323 assertions) on disposable Supabase.
- **Hosted:** migration 025 is merged in PR #28 and recorded as `025` in the hosted ledger, verified 2026-10-25. Its behavior is superseded by migration 026, which is subsequently owner-confirmed hosted.
- **Notifications:** no staff notification delivery mechanism is implemented. Draft uploads do not create staff queue entries or trigger staff notifications; the notification function remains a placeholder.

## Implemented product slices

### Slice 1 — verification case workflow

**Current / implemented on `main`:** a customer can submit a synthetic Abuja/FCT verification request; authorized staff can use the work queue; a department lead can assign the case manually; and the active assignee can move it through the allowed workflow states with append-only status events. The customer can see customer-visible timeline events. Handover, acceptance/decline and separate preparer/approver controls remain planned.

**Current / implemented on `main` and hosted:** [PR #17](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/17) adds explicit customer-only dashboard/detail queries, staff-role badges and a separate staff-workspace link. Migration `020_customer_safe_status.sql` adds fixed customer-safe status events, private staff notes and optional customer messages; it was applied to hosted Supabase on 2026-10-20.

**Current / implemented on `main`, CI-verified and hosted:** [PR #21](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/21) adds migration `021_case_creation_idempotency_and_response_event.sql`. Case creation now accepts a customer-scoped UUID idempotency key: replaying the same key and same normalized request returns the existing case, while reusing it with different request data is rejected. Case timeline events have explicit kinds, including `information_requested` and `customer_response`. The customer response writes a fixed safe status line and a separate response event. Migration `021` was applied to hosted Supabase on 2026-10-21. Implementation, disposable-CI verification and hosted application are separate claims; operational multi-account testing remains pending below.

### Slice 2 — private case evidence

**Historical Slice 2 behavior (superseded by the 026 branch correction above):** migration `019` allowed synthetic PDF/JPEG/PNG evidence on an owned open case, with server-side size/type/signature validation, case-scoped metadata, immutable version lineage and transactional event/audit registration. A customer waiting in `needs_customer_info` can respond and return the case to `in_review`; migration `021` distinguishes that response from an information request in the timeline.

**Current / implemented:** authorized staff retrieval uses the audited RPC followed by a server-only service-role signed URL. Evidence is downloaded as an attachment and remains labelled customer-supplied and unauthenticated. Customers cannot retrieve their own uploaded objects yet.

## Automated evidence

The latest green workflows associated with the current merged `main` changes are:

- [CI run 39584206476](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39584206476) - lint, typecheck, unit tests, integration tests, security guardrails and production build passed for PR #21.
- [Database security run 39584206434](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39584206434) - migrations through `021` and all pgTAP suites passed in a disposable Supabase environment. That CI run was not itself the hosted apply; migration `021` was separately applied on 2026-10-21.

The latest visible verification for merged migration 024 is [app run 39961078177](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39961078177): 47 unit tests, 19 integration tests (3 skipped), lint, typecheck, guardrails and build. [Database run 39961078498](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39961078498) passed eight pgTAP suites (303 assertions). The merged PR #28 verification is recorded above. Migration 025 was independently confirmed hosted on 2026-10-25; migration 026 is subsequently owner-confirmed hosted. Disposable CI is not hosted deployment evidence.

## Accepted hosted advisor items

The following are recorded as accepted or intentionally deferred for the current prototype, not as proof of production readiness:

- `spatial_ref_sys` RLS finding — PostGIS-managed/system boundary.
- PostGIS installed in the `public` schema — accepted for the current prototype; revisit before substantial GIS work.
- PostGIS `st_estimatedextent` function findings — extension-managed surface accepted for the current prototype.
- leaked-password protection — disabled on the existing Free project and documented by Supabase as Pro-and-above functionality; this is an accepted preview limitation, not an enabled control. Reassess before production or a plan change.

Application-owned findings are not covered by these acceptances and must be fixed through reviewed forward changes.

## Not yet verified or complete

- **Operational verification pending:** a real upload and audited staff download through the running application against hosted Supabase.
- **Operational verification pending:** realistic multi-account isolation for customer A/customer B, assigned staff, department leads and out-of-scope staff.
- **Operational verification pending:** hosted email confirmation, invalid/expired confirmation and recovery links, and other hosted email flows beyond the password-reset path already exercised.
- **Operational verification pending:** login/session navigation and customer/staff workspace switching in a real browser against isolated staging.
- **Deployment gate:** Netlify Free runtime compatibility, including a permitted 9–10 MB evidence upload, must be proven before preview invitations.
- **Product gap:** customers cannot retrieve their own uploaded evidence.
- **Product/operations gaps:** privacy, terms and cookie pages; data-retention/deletion decisions; malware scanning; monitoring and production operations.
- **Not claimed:** production readiness, legal compliance, government certification, statutory verification or a completed land-verification service.

See [KNOWN-ISSUES.md](KNOWN-ISSUES.md) for the actionable open-item list and [RUNBOOK.md](RUNBOOK.md) for routine operator commands.
