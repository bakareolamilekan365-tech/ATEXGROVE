# Atexgrove Current Status

## Login/session navigation correction (2026-10-27)

**Implemented on `fix/login-session-and-docs-reconciliation`; browser acceptance pending:** successful email/password sign-in now makes one full-document request to a validated internal `?next=` destination or `/dashboard`. This avoids racing `router.push` with an immediate refresh across the authentication boundary. Customer/staff workspace boundary links use the same fresh-request principle. Middleware preserves refreshed Supabase cookies and cache-control headers when returning redirects.

Unit coverage exercises successful/failed sign-in navigation and unsafe redirect inputs; integration coverage exercises protected-route redirects and refreshed-cookie propagation. The reported browser symptom was not independently reproduced against a safe isolated authentication environment, so immediate login, recovery completion, sign-out, account switching and customer/staff navigation remain operational verification items. No hosted Supabase state or deployment was changed.

## Current correction — pending evidence submission (2026-10-25)

Hosted ledger checked read-only on 2026-10-25: migrations `001`–`025`. PR #28 is merged and 025 is hosted. Earlier dated statements below describe the state when written and are superseded by this section for current state.

The repository includes forward-only `026_pending_evidence_submission.sql`, merged in PR #29. It is **CI-verified and not hosted**. Evidence registration writes metadata and an audit, not a case milestone. Each file remains pending (`submitted_at IS NULL`) until owner submission releases it. Staff evidence RLS and audited downloads require a submitted timestamp plus existing case scope. Draft and discarded-draft protections remain. Old visible evidence remains available; draft/discarded evidence remains pending.

The customer prepares files only during draft or `needs_customer_info`; after submission they must wait for a staff request. Staff cannot resume an awaiting-information case; only the customer reply resumes review, while closure/cancellation keep pending files private. The generic upload form starts with an empty required document-type placeholder; replacement mode is unavailable until a type is chosen. Explicit request/response submission releases all pending versions together; response submission writes one milestone containing the required message. A request-event token and uniqueness guard make retries harmless across later information rounds. Document history retains versions, upload dates and release state; the main timeline filters upload activity and unambiguous historical duplicate response lines without deleting records.

Validation is recorded in PR #29 and the dated engineering-log entry. This migration-name correction does not apply migration 026 or deploy application code.


**Status date:** 2026-10-25

**Authority:** This file is the single source of truth for current implementation, hosted deployment, automated evidence and open operational verification. Architecture documents describe intended boundaries; dated audit sections remain historical.


**Verified follow-up revision `29d31036b2a4a8208bafbc8cfc7cc4a5083d4def`:** [App CI 40194071878](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40194071878) passed lint, typecheck, **75 unit tests**, **26 integration tests** (3 existing credential-gated skips), security guardrails and production build. [Database CI 40194071685](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40194071685) passed **10 pgTAP suites / 494 assertions** on the full disposable Supabase stack and **13 actual 025 → 026 upgrade assertions**, **507 database assertions total**. Authenticated owner/assignee tests exhaust every staff destination while evidence is pending, reject resumption, preserve terminal privacy and prove customer replies release files before review resumes. Migration 026 remains **not hosted**; migrations 001–025 are unchanged. No merge, deployment or hosted migration was performed.

**Prior baseline verification (does not cover the latest follow-up patch), code commit `18cc17b99469ba2915b51a301dccc0aff4c7b7e2`:** [App CI 40176136069](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40176136069) passed lint, typecheck, 70 unit tests, 26 integration tests (3 existing credential-gated skips), security guardrails and production build. [Database CI 40176136055](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40176136055) passed all nine regular pgTAP suites (436 assertions), then reset its disposable LOCAL database to 025, seeded historical fixtures, applied the real 026 file and passed 13 upgrade assertions: **449 database assertions total**. Tests exercise authenticated owners, leads, assignees, scoped application admins and out-of-scope users. Local Playwright completed with four existing placeholder tests skipped; this is not full browser acceptance evidence. No hosted migration, merge or deployment was performed.

## Current hosted state

- **Current / hosted:** Supabase migration ledger reads `001`–`025`, checked read-only after the controlled history normalization on 2026-10-25. Migration `021_case_creation_idempotency_and_response_event.sql` was applied on 2026-10-21; migration `022_assignment_events_location_and_contact.sql` on 2026-10-23; migration 023 was applied after PR #26 merged per owner confirmation; the ledger confirms migrations 024 and 025 are applied but does not report their original apply times.
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
- **Hosted:** migration 025 is merged in PR #28 and recorded as `025` in the hosted ledger, verified 2026-10-25. Its behavior is superseded on this branch by pending migration 026; 026 is not hosted.
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

The latest visible verification for merged migration 024 is [app run 39961078177](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39961078177): 47 unit tests, 19 integration tests (3 skipped), lint, typecheck, guardrails and build. [Database run 39961078498](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39961078498) passed eight pgTAP suites (303 assertions). The merged PR #28 verification is recorded above. Migration 025 is separately confirmed hosted on 2026-10-25. Disposable CI is not hosted deployment evidence; new migration 026 remains not hosted.

## Accepted hosted advisor items

The following are recorded as accepted or intentionally deferred for the current prototype, not as proof of production readiness:

- `spatial_ref_sys` RLS finding — PostGIS-managed/system boundary.
- PostGIS installed in the `public` schema — accepted for the current prototype; revisit before substantial GIS work.
- PostGIS `st_estimatedextent` function findings — extension-managed surface accepted for the current prototype.
- leaked-password protection — unavailable on the current Free plan; reassess before production or a plan change.

Application-owned findings are not covered by these acceptances and must be fixed through reviewed forward changes.

## Not yet verified or complete

- **Operational verification pending:** a real upload and audited staff download through the running application against hosted Supabase.
- **Operational verification pending:** realistic multi-account isolation for customer A/customer B, assigned staff, department leads and out-of-scope staff.
- **Operational verification pending:** hosted email confirmation, invalid/expired confirmation and recovery links, and other hosted email flows beyond the password-reset path already exercised.
- **Product gap:** customers cannot retrieve their own uploaded evidence.
- **Product/operations gaps:** privacy, terms and cookie pages; data-retention/deletion decisions; malware scanning; monitoring and production operations.
- **Not claimed:** production readiness, legal compliance, government certification, statutory verification or a completed land-verification service.

See [KNOWN-ISSUES.md](KNOWN-ISSUES.md) for the actionable open-item list and [RUNBOOK.md](RUNBOOK.md) for routine operator commands.
