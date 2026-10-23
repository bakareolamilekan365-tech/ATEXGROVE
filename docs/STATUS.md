# Atexgrove Current Status

**Status date:** 2026-10-23

**Authority:** This file is the single source of truth for current implementation, hosted deployment, automated evidence and open operational verification. Architecture documents describe intended boundaries; dated audit sections remain historical.

## Current hosted state

- **Current / hosted:** Supabase migrations `001`-`021` are recorded on the linked hosted project. Migration `021_case_creation_idempotency_and_response_event.sql` was applied on 2026-10-21.
- **Current / hosted:** the `documents` bucket is private, has a 10 MB object limit and allows only PDF, JPEG and PNG MIME types.
- **Current / hosted:** `storage.objects` has exactly one Atexgrove policy for the `documents` bucket: authenticated customers may insert into an owned, eligible case path. There is no authenticated object SELECT, UPDATE or DELETE policy.
- **Current / hosted:** staff downloads must first pass the audited `authorize_case_evidence_download` RPC. Only the server-side admin client, using the server-only service-role credential, creates the 60-second signed download URL.

These hosted configuration observations do not prove realistic multi-account behavior through the application.

## Current branch work — migration 022 and sign out

- **Implemented on `fix/assignment-events-location-and-contact`:** migration 022 replaces assignment notes with a fixed customer event plus a private staff note; adds structured FCT council/area/address fields and optional consented phone contact; and adds POST sign-out for customer/staff views. Protected responses are marked `private, no-store`.
- **Follow-up fixes in PR #24:** migration 022 normalizes the legacy `Kwali LGA` council value before adding its `NOT VALID` check, and assignment now blocks both assigning a case to its customer and a customer acting as the assigning lead. A unit test checks that the SQL and TypeScript starter-area lists stay identical; old cases tolerate missing area/address values.
- **Local verification on 2026-10-23:** lint, typecheck, 36 unit tests, 14 integration tests (3 credential-gated skips), security guardrails and production build passed. The six pgTAP suites (191 assertions) passed in disposable Supabase CI; Docker is not installed locally.
- **CI-verified, not hosted:** [CI run 39909627609](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39909627609) passed lint, typecheck, 36 unit tests, 14 integration tests (3 skipped), guardrails and production build. [Database security run 39909627678](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39909627678) successfully started Supabase and passed all six pgTAP suites (191 assertions).
- **Hosted:** migration 022 has not been applied. Hosted remains at 001-021.
- **Not included:** no idle timeout is implemented; the timeout policy remains undecided.

## Current branch work — case-form UX

- **Implemented on `fix/case-form-ux`:** shared listed-value council/area selects with keyboard navigation and hidden-input submission; field-specific accessible validation errors that preserve entries; application-side 10-character address minimum (database minimum remains 3); and explicit wording for legacy cases with no detailed location. No schema, migration, or hosted changes are included.
- **CI-verified:** [CI run 39944706900](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39944706900) passed lint, typecheck, 39 unit tests, 14 integration tests (3 skipped), security guardrails and production build. [Database security run 39944706867](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39944706867) passed all 6 pgTAP suites (191 assertions) on a disposable Supabase stack.
- **Hosted:** not applicable to this UI-only change; hosted database state is unchanged.

## Current repository brand assets

The owner-confirmed Atexgrove logo, mark and wordmark SVGs are in `public/logo`. The mark is used in the staff header and as `src/app/icon.svg`.

## Current branch work — draft-first case uploads and customer cancellation

- **Implemented on `feat/draft-case-with-uploads`:** migration 023 changes new requests to start as private drafts, allows the customer to add evidence before submission, and adds submit, discard-draft and open-case cancellation RPCs and UI. Staff scope excludes active drafts and discarded-draft history, including their events and evidence; evidence downloads remain audited. Existing evidence rules are preserved.
- **CI-verified, not hosted:** [CI run 39947770243](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39947770243) passed lint, typecheck, 40 unit tests, 17 integration tests (3 skipped), security guardrails and production build. [Database security run 39947770295](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39947770295) applied migrations through 023 on a disposable Supabase stack and passed all seven pgTAP suites (238 assertions).
- **Hosted:** migration 023 has not been applied. Hosted remains at migrations 001-021; migration 022 is also not hosted.
- **Retention:** discarded draft records and uploaded files are kept; retention/cleanup and customer deletion of draft evidence are not implemented.

## Implemented product slices

### Slice 1 — verification case workflow

**Current / implemented on `main`:** a customer can submit a synthetic Abuja/FCT verification request; authorized staff can use the work queue; a department lead can assign the case manually; and the active assignee can move it through the allowed workflow states with append-only status events. The customer can see customer-visible timeline events. Handover, acceptance/decline and separate preparer/approver controls remain planned.

**Current / implemented on `main` and hosted:** [PR #17](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/17) adds explicit customer-only dashboard/detail queries, staff-role badges and a separate staff-workspace link. Migration `020_customer_safe_status.sql` adds fixed customer-safe status events, private staff notes and optional customer messages; it was applied to hosted Supabase on 2026-10-20.

**Current / implemented on `main`, CI-verified and hosted:** [PR #21](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/21) adds migration `021_case_creation_idempotency_and_response_event.sql`. Case creation now accepts a customer-scoped UUID idempotency key: replaying the same key and same normalized request returns the existing case, while reusing it with different request data is rejected. Case timeline events have explicit kinds, including `information_requested` and `customer_response`. The customer response writes a fixed safe status line and a separate response event. Migration `021` was applied to hosted Supabase on 2026-10-21. Implementation, disposable-CI verification and hosted application are separate claims; operational multi-account testing remains pending below.

### Slice 2 — private case evidence

**Current / implemented on `main` and schema deployed through migration `019`:** a customer can upload synthetic PDF/JPEG/PNG evidence to an owned open case, with server-side size/type/signature validation, case-scoped metadata, immutable version lineage and transactional event/audit registration. A customer waiting in `needs_customer_info` can respond and return the case to `in_review`; migration `021` distinguishes that response from an information request in the timeline.

**Current / implemented:** authorized staff retrieval uses the audited RPC followed by a server-only service-role signed URL. Evidence is downloaded as an attachment and remains labelled customer-supplied and unauthenticated. Customers cannot retrieve their own uploaded objects yet.

## Automated evidence

The latest green workflows associated with the current merged `main` changes are:

- [CI run 39584206476](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39584206476) - lint, typecheck, unit tests, integration tests, security guardrails and production build passed for PR #21.
- [Database security run 39584206434](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39584206434) - migrations through `021` and all pgTAP suites passed in a disposable Supabase environment. That CI run was not itself the hosted apply; migration `021` was separately applied on 2026-10-21.

Latest merged-main evidence is 31 passing unit tests, 13 passing integration tests with 3 hosted-credential tests intentionally skipped, and 166 pgTAP assertions across five suites. On this branch, CI run 39909627609 passed 36 unit tests and 14 integration tests (3 skipped), while run 39909627678 passed all 191 assertions across six pgTAP suites. Automated disposable-environment evidence is not hosted-environment verification. Migration 022 remains not hosted.

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
