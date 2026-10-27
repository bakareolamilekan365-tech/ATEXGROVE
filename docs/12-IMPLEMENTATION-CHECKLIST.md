# Atexgrove — Implementation Checklist

Use this as an engineering gate, not a list of screens. Every item should be marked **NOT STARTED**, **IN PROGRESS**, **IMPLEMENTED** or **VERIFIED** based on repository evidence. Documentation alone never earns IMPLEMENTED or VERIFIED.

## Status definitions

- **NOT STARTED** — no working implementation or accepted design evidence.
- **IN PROGRESS** — partial implementation exists; important paths remain incomplete.
- **IMPLEMENTED** — real behavior is connected to its intended persistence/security boundary.
- **VERIFIED** — implementation passes relevant tests/review, including failure and authorization cases.

## Current evidence

See [STATUS.md](STATUS.md) for the single current record of hosted deployment, implemented slices, green CI/database-test runs and operational verification gaps. This checklist remains the engineering gate and must not be used to override that dated status record.

## Foundation

- [ ] **NOT STARTED / IN PROGRESS / IMPLEMENTED / VERIFIED** — requirements, prototype journey, design tokens and current-vs-future labels are approved.
- [ ] **NOT STARTED / IN PROGRESS / IMPLEMENTED / VERIFIED** — environment validation, GitHub workflow and Supabase connection work without committed secrets.
- [ ] **NOT STARTED / IN PROGRESS / IMPLEMENTED / VERIFIED** — modular-monolith domain boundaries and provider adapter seams are documented and respected.

## Database

- [ ] Migrations apply cleanly and match the current schema contract.
- [ ] Foreign keys, constraints, timestamps and jurisdiction/provenance fields are deliberate.
- [ ] Seed/demo data is reproducible and labelled DEMO DATA / NOT OFFICIAL.
- [ ] Indexes, pagination-friendly queries and spatial indexes exist where actual access patterns require them.

## Auth and authorization

- [ ] Supabase sign-up, login, session handling and route protection work against the real service.
- [ ] Profile/onboarding behavior persists real data.
- [ ] Ownership, organization membership, project membership, permissions and scope are checked server-side.
- [ ] Platform role, discipline, organization/project role, subscription and entitlement remain distinct.
- [ ] Separated administrative responsibilities prevent unrestricted “God Admin” access.
- [ ] **Planned — Slice 3:** staff conflict declaration and independent professional correction/review controls ([S-a](BACKLOG.md#s-a), [P-28](BACKLOG.md#p-28), [P-33](BACKLOG.md#p-33)).
- [ ] **Planned — before real users:** authorized staff lifecycle, action-level permission matrix, temporary elevation/review, sensitive-action approval and audited override ([S-61](BACKLOG.md#s-61), [S-62](BACKLOG.md#s-62), [S-44](BACKLOG.md#s-44), [S-45](BACKLOG.md#s-45), [S-46](BACKLOG.md#s-46), [S-48](BACKLOG.md#s-48), [S-49](BACKLOG.md#s-49)).
- [ ] **Planned — before real users:** processor/vendor register and data-access boundaries ([X-42](BACKLOG.md#x-42), [X-47](BACKLOG.md#x-47)).

## RLS and security

- [ ] RLS policies cover each protected table and are tested for allow/deny cases.
- [ ] The RLS guardrail check fails when an application-owned public table is introduced without RLS; system-managed Supabase schemas are intentionally excluded.
- [ ] New protected tables include explicit grants, per-operation policies and database allow/deny tests in the same change.
- [ ] BOLA/IDOR, privilege escalation and alternate endpoint/download paths are blocked.
- [ ] Service-role credentials remain server-only; secrets are absent from source control.
- [ ] Sensitive mutations, verification decisions, document access and admin actions are auditable.
- [ ] Rate limits, secure sessions, validation, safe errors, headers/configuration and monitoring are reviewed proportionally.

## Verification case and private evidence (Phase 2)

- [x] **IMPLEMENTED ON MAIN — draft-first intake:** customer-created cases begin as private drafts; owners can add optional private evidence, submit, discard drafts or cancel open cases. Migration 023 is hosted per owner confirmation; see [STATUS.md](STATUS.md) for CI evidence.
- [x] **IMPLEMENTED ON CURRENT BRANCH — draft privacy:** staff case, event and evidence reads plus audited download authorization exclude active drafts and cases with `discarded_at` set. Discarded drafts/files and cancellation evidence remain retained pending policy.

- [x] **IMPLEMENTED ON CURRENT BRANCH — migration 024 intake:** captures controlled intent and land-relationship claims plus who the request is for; representation requires a principal name and authority confirmation. Legacy values stay null and render “Not recorded”; staff labels these fields “Customer's claim, not verified.” [C-08](BACKLOG.md#c-08), [C-09](BACKLOG.md#c-09), [C-13](BACKLOG.md#c-13), [C-14](BACKLOG.md#c-14).
- [x] **IMPLEMENTED ON CURRENT BRANCH — submission consent and case reference:** current notice acceptance is required and written once by the submit RPC; annual human-readable references are allocated at submission (not draft creation), restart at `000001` each year, and backfill eligible legacy cases by year, `created_at`, then `id`. [C-04](BACKLOG.md#c-04), [C-16](BACKLOG.md#c-16), [C-17](BACKLOG.md#c-17).
- [x] **IMPLEMENTED ON CURRENT BRANCH — draft wording and intake consistency:** drafts are labelled `Saved` / `Draft`, not `Received`; `representing_someone` cannot be paired with `acting_for = self`.
- [x] **IMPLEMENTED ON CURRENT BRANCH — next-action and evidence guidance:** customer pages derive the next-action label in application code; the checklist displays optional evidence categories, rationale and supplied counts. [C-19](BACKLOG.md#c-19), [C-20](BACKLOG.md#c-20).
- [x] **HISTORICAL CI — initial migration 024 implementation:** app run [39954573306](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39954573306) passed lint, typecheck, 45 unit tests, 19 integration tests (3 skipped), guardrails and production build; database run [39954573310](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39954573310) passed eight pgTAP suites (287 assertions). These runs predate the annual-numbering follow-up and are retained as history. Migration 024 is now recorded in the hosted ledger.

- [x] **IMPLEMENTED / AUTOMATED VERIFIED IN TEMPORARY CI — Slice 1:** a customer can submit a synthetic Abuja/FCT case without an existing parcel/listing and see their own cases. Staff-assisted creation remains later work.
- [x] **IMPLEMENTED / AUTOMATED VERIFIED IN TEMPORARY CI — Slice 1:** `submitted → assigned → in_review → needs_customer_info → in_review → closed/cancelled` is enforced through transactional RPCs; on the 026 branch only a customer reply resumes review from `needs_customer_info`, while staff may close/cancel with actor, note and timestamp events. `closed` is labelled “Closed — no verification result issued” so closure is not presented as a verification outcome.
- [x] **IMPLEMENTED / AUTOMATED VERIFIED IN TEMPORARY CI — Slice 1:** an active department lead assigns manually; non-leads and cross-department leads are denied. Acceptance/decline/handover and preparer/approver separation remain Slice 3.
- [x] **IMPLEMENTED / AUTOMATED VERIFIED IN TEMPORARY CI — Slice 1:** RLS limits customers to their own cases/customer-safe timeline and staff to department-lead or active-assignment scope; status events are append-only.
- [x] **IMPLEMENTED / AUTOMATED VERIFIED IN TEMPORARY CI — Slice 1 context separation:** customer dashboard/detail queries explicitly require the signed-in customer; active staff receive a separate `/ops/cases` workspace link and customer/staff badges. Hosted migration `020` separates fixed customer-safe statuses, private staff notes and optional customer messages.
- [x] **IMPLEMENTED / AUTOMATED VERIFIED / OWNER-CONFIRMED HOSTED — Slice 2:** customers can add up to 10 synthetic PDF/JPEG/PNG versions only in an owned `draft` or `needs_customer_info` case; metadata/audit records are registered without an upload timeline milestone, evidence versions are immutable, and pending files stay invisible to staff until explicit submission. Realistic hosted multi-account behavior remains unverified.
- [x] **IMPLEMENTED / AUTOMATED VERIFIED IN TEMPORARY CI — Slice 2:** case-scoped staff retrieval is audited and uses a 60-second attachment URL created by the server-only admin client; authenticated clients have no direct object-read policy.
- [x] **IMPLEMENTED / AUTOMATED VERIFIED IN TEMPORARY CI — Slice 2:** a case owner can respond from `needs_customer_info` and resume `in_review`; evidence can be added before the response.
- [x] **IMPLEMENTED / AUTOMATED VERIFIED IN TEMPORARY CI — migration 021:** replaying a customer idempotency key with the same request returns the existing case; conflicting request data is rejected. Event kinds distinguish status changes, staff notes, information requests, customer messages and customer responses. Migration `021` is hosted (applied 2026-10-21).
- [x] **AUTOMATED VERIFIED IN TEMPORARY CI — migration 021:** pgTAP covers idempotent replay, conflicting payload rejection, cross-customer keys, function privileges, event kinds and customer visibility. See [STATUS.md](STATUS.md) for current run evidence and hosted boundary.
- [x] **DEPLOYED — Slice 2 schema:** migration `019` is recorded on hosted Supabase as of 2026-10-20; migration `020` is hosted; migration `021` was applied 2026-10-21; migration `022` was applied 2026-10-23. The real application upload/download journey and realistic hosted multi-account isolation remain unverified.
- [x] **MIGRATION 022 — HOSTED 2026-10-23:** fixed customer-safe assignment event plus private staff note; council preflight and FCT location/contact fields. CI run [39909627609](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39909627609) passed app checks; database run [39909627678](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39909627678) passed 191 pgTAP assertions. The POST sign-out flow was CI-verified; no idle timeout is implemented.
- [ ] Verification records have explicit type, status, evidence, source, reviewer, authority and dates.
- [ ] Authority hierarchy is visible; internal review is not represented as official certification.
- [ ] Documents use private storage, authorization before retrieval, validation and controlled access.
- [ ] Version lineage is preserved; important evidence is not silently overwritten.
- [ ] Draft/Submitted/Under Review/Approved/Rejected/Archived transitions are validated and audited.

**Current migration state:** the linked hosted ledger was independently checked through 025 after controlled history normalization on 2026-10-25; migration 026 is subsequently owner-confirmed hosted and no apply timestamp is claimed. The annual-numbering follow-up passed app run [39961078177](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39961078177) and database run [39961078498](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39961078498). Migration 025 passed app run [39974685742](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39974685742) and database run [39974685721](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39974685721). Migration 026's latest recorded disposable CI is app run [40194071878](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40194071878) and database run [40194071685](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40194071685). CI does not prove hosted behavior.

**Historical migration 023 branch evidence:** CI run [39948240236](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39948240236) passed lint, typecheck, 40 unit tests, 17 integration tests (3 skipped), security guardrails and production build. Database run [39948240244](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39948240244) passed seven pgTAP suites (238 assertions) in a disposable Supabase environment. Migration 023 was subsequently applied after PR #26 merged, per owner confirmation.

**Known Slice 2 limits:** no malware scanning is available in this free-plan cut, so files remain untrusted, download-only and limited to PDF/JPEG/PNG with server-side file-signature checks. Customers cannot retrieve their own uploaded files yet. The 10-file limit counts registered evidence rows; uploads that never complete registration are not counted, which is a known free-plan limitation despite server cleanup after a failed registration. Evidence is customer-supplied and unauthenticated. Real customer documents remain prohibited pending the privacy/legal readiness gate. Evidence review/findings, staff uploads, handover/escalation and preparer/approver separation remain later work. Draft retention/cleanup is undecided; draft evidence is not automatically deleted. The privileged `service_role`/database-operator path can still perform exceptional maintenance and must be controlled and audited.

### November direct-upload readiness

- [x] **IMPLEMENTED IN REPOSITORY:** evidence bytes upload from the authenticated browser directly to private Supabase Storage; the Next.js finalization action receives metadata only.
- [x] **IMPLEMENTED IN REPOSITORY:** finalization rechecks ownership/state/path and verifies authoritative Storage size, MIME and an eight-byte signature prefix before calling `register_case_evidence`.
- [x] **LOCALLY VERIFIED:** the linked private-object endpoint returned HTTP 206 and exactly bytes 0-7 for an existing object; this read-only check is not deployed Netlify acceptance.
- [ ] **AUTOMATED VERIFIED IN CI:** lint, typecheck, unit/integration suites, guardrails and build pass for this implementation revision.
- [ ] **OPERATIONALLY PENDING:** create and isolate the approved Netlify/Supabase staging environment.
- [ ] **OPERATIONALLY PENDING:** complete browser-direct uploads at approximately 1 MiB, 5 MiB, 9 MiB and near the permitted 10 MiB limit through deployed Netlify staging.
- [ ] **OPERATIONALLY PENDING:** reject a staging file whose declared MIME/extension and stored magic bytes disagree.
- [ ] **OPERATIONALLY PENDING:** verify realistic multi-account upload isolation, pending-evidence staff invisibility, explicit release and audited staff download.
- [ ] **OPERATIONALLY PENDING:** verify real browser/session behavior and exercise the manual orphan-cleanup procedure without deleting registered evidence.

No migration 027 exists for this work. Potential private orphan objects and weaker pre-registration quota concurrency are accepted preview limitations; durable reservations and automated expiry remain deferred.

## Feasibility

- [ ] Inputs are validated and assumptions are explicit.
- [ ] Calculations are deterministic, reproducible and scenario-comparable.
- [ ] Outputs are labelled estimates, not guaranteed financial or regulatory outcomes.
- [ ] Source/provenance is retained for future external cost/market/regulatory data.
- [ ] The report identifies exact evidence versions, limitations and unresolved matters.
- [ ] Consequential conclusions require a genuinely separate discipline-appropriate review.

## Land and GIS (Phase 4)

- [ ] Real persistence supports parcel discovery, filtering, detail and map selection only after the case/report workflow is proven.
- [ ] Geometry uses explicit coordinate/reference-system metadata and source/update/jurisdiction provenance.
- [ ] Visual GIS, survey, cadastral and official/statutory boundaries are distinct in data and UI.
- [ ] Viewport loading, pagination/lazy loading and spatial performance are adequate for the current dataset.
- [ ] A Phase 2 contextual site map remains limited and does not make a parcel/listing prerequisite for case creation.

## Projects and professionals (Phase 5)

- [ ] Project creation from a completed case or parcel persists real records.
- [ ] Project membership/roles and organization scope are enforced.
- [ ] Professionals can be associated with projects without turning discipline into permission.
- [ ] Project documents and activity use the same access and audit rules.
- [ ] **Planned — before real users:** professional firm/identity records, assignment scope, selected-document access, expiry/revocation, document-level audit, agreement and retention handling ([P-12](BACKLOG.md#p-12), [P-31](BACKLOG.md#p-31), [P-d](BACKLOG.md#p-d), [P-50](BACKLOG.md#p-50), [X-51](BACKLOG.md#x-51)).
- [ ] **Planned — Slice 3 and later:** professional context, case conflict declarations, review/correction, deliverable acceptance/versioning and replacement/disengagement ([P-10](BACKLOG.md#p-10), [P-11](BACKLOG.md#p-11), [P-33](BACKLOG.md#p-33), [P-24](BACKLOG.md#p-24), [P-28](BACKLOG.md#p-28), [P-60](BACKLOG.md#p-60)).

## Admin

- [ ] Admin screens expose only granted responsibility/scope.
- [ ] Verification, operations, compliance, support and future billing responsibilities remain separable.
- [ ] Sensitive changes require audit records and appropriate review/approval separation.

## Testing

- [ ] Unit tests cover validation, permission decisions, verification transitions and feasibility calculations.
- [ ] Integration tests cover persistence, RLS, storage privacy, API boundaries and provider failures.
- [ ] E2E tests cover the critical prototype journey and permission-denied/error states.
- [ ] Security regression cases cover unauthorized users, wrong owner/organization/project, privilege escalation, invalid uploads and malicious/untrusted input.

## Observability and release readiness

- [ ] Errors, provider outages, timeouts and retry behavior are observable without leaking sensitive data.
- [ ] Backups/recovery, credential rotation and incident-response ownership are planned before production use.
- [ ] Accessibility, responsive behavior, loading/empty/error states and synthetic-data labels are reviewed.
- [ ] Typecheck, lint, build and relevant tests pass in CI.

## Foundation gate evidence

Track these items from implementation evidence, not documentation alone:

- **Password recovery/email confirmation:** recovery request, PKCE callback, safe internal redirect and authenticated password update.
- **Profile onboarding/dashboard:** full name, phone, location and bio persist for the authenticated user; dashboard copy reflects the selected platform role without implying future modules exist.
- **Organization security:** creator spoofing, self-verification, admin escalation, owner transfer/removal and last-owner loss are denied by database policy/trigger behavior.
- **Private storage:** the hosted `documents` bucket is private, limited to 10 MB PDF/JPEG/PNG objects and has one authenticated Storage policy: customer insert into an owned eligible case path. It has no authenticated SELECT, UPDATE or DELETE policy. Staff retrieval must use the audited authorization RPC followed by a server-only service-role signed URL.
- **Synthetic fixtures:** demo users/organizations are reproducible, synthetic and labelled `DEMO DATA / NOT OFFICIAL`.
- **Requirement-specific tests:** behavior, persistence, denial paths and recovery states are covered; smoke/source-text checks do not substitute for them.

Current gate state:

| Gate | Status | Evidence / remaining work |
| --- | --- | --- |
| Hosted migrations | **IMPLEMENTED** | Current deployment evidence is maintained in [STATUS.md](STATUS.md). |
| Application foundation RLS enabled | **IMPLEMENTED** | Read-only hosted inspection confirms RLS on four application tables. |
| Private documents bucket/policies | **IMPLEMENTED / AUTOMATED VERIFIED** | Bucket is private with the enforced size/MIME limits and one customer INSERT policy; staff retrieval uses audited authorization plus a server-only signed URL. Realistic hosted multi-account isolation remains pending. |
| Organization/profile hardening | **IMPLEMENTED / AUTOMATED VERIFIED** | Policies/triggers are deployed and temporary-environment pgTAP ALLOW/DENY tests passed; hosted-user behavior remains pending. |
| Recovery and email confirmation | **IN PROGRESS** | Code exists; hosted email, redirect, expiry and error behavior remain unverified. |
| Database security tests | **VERIFIED IN TEMPORARY CI** | Current run evidence and assertion counts are maintained in [STATUS.md](STATUS.md). This does not mark hosted authorization verified. |
| Synthetic fixtures | **IMPLEMENTED** | Deterministic tooling exists; use only synthetic identities and non-sensitive files. |
| Production readiness | **NOT STARTED** | Security findings, operations, monitoring, recovery and complete journeys remain open. |

## Definition of done

```text
Feature works
AND authorization works
AND persistence works
AND tests cover important paths
AND failure behavior is understood
AND security boundaries are preserved
```

Do not require unrealistic 100% coverage. Require evidence for the paths that can expose data, change trust state, affect money in the future or mislead a user about authority.
