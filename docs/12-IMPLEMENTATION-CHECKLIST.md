# Atexgrove — Implementation Checklist

Use this as an engineering gate, not a list of screens. Every item should be marked **NOT STARTED**, **IN PROGRESS**, **IMPLEMENTED** or **VERIFIED** based on repository evidence. Documentation alone never earns IMPLEMENTED or VERIFIED.

## Status definitions

- **NOT STARTED** — no working implementation or accepted design evidence.
- **IN PROGRESS** — partial implementation exists; important paths remain incomplete.
- **IMPLEMENTED** — real behavior is connected to its intended persistence/security boundary.
- **VERIFIED** — implementation passes relevant tests/review, including failure and authorization cases.

## Current evidence snapshot — 2026-10-19

Hosted Supabase now records migrations `001`-`018`. Slice 2 migration `019` and its application/tests are repository changes only until review, green CI and explicit deployment approval.

- **DEPLOYED/CONFIGURATION RECORDED:** hosted migration history contains `001`-`018`; the `documents` bucket is private; its currently hosted policies remain the foundation user-scoped policies until migration `019` is approved. Slice 1 case tables and the foundation tables use RLS.
- **IMPLEMENTED IN CODE:** password recovery request, PKCE callback, safe internal redirects, authenticated password update, profile onboarding fields, role-aware dashboard copy, server authorization helpers, synthetic fixture tooling, membership-owner protection, security guardrails, pgTAP suites, and Docker-backed database-test CI.
- **AUTOMATED VERIFIED:** general CI [run 38276873401](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/38276873401) and database-security [run 38276873408](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/38276873408) passed for PR #9 head commit `c259db0`; pgTAP executed in a temporary Supabase environment.
- **NOT YET HOSTED/OPERATIONALLY VERIFIED:** realistic hosted-user authorization and document isolation, hosted email confirmation/recovery including invalid/expired links, complete E2E journey and production readiness.
- **OPEN HOSTED/OPERATIONAL FINDINGS:** live Supabase advisor findings and realistic hosted-session checks remain. Migration `018` is recorded remotely; migration `019` is not.

Migration deployment and temporary-environment automated database tests are complete, but the foundation is not fully **VERIFIED** until hosted behavioral and operational evidence closes the remaining gates.

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

## RLS and security

- [ ] RLS policies cover each protected table and are tested for allow/deny cases.
- [ ] The RLS guardrail check fails when an application-owned public table is introduced without RLS; system-managed Supabase schemas are intentionally excluded.
- [ ] New protected tables include explicit grants, per-operation policies and database allow/deny tests in the same change.
- [ ] BOLA/IDOR, privilege escalation and alternate endpoint/download paths are blocked.
- [ ] Service-role credentials remain server-only; secrets are absent from source control.
- [ ] Sensitive mutations, verification decisions, document access and admin actions are auditable.
- [ ] Rate limits, secure sessions, validation, safe errors, headers/configuration and monitoring are reviewed proportionally.

## Verification case and private evidence (Phase 2)

- [x] **IMPLEMENTED / AUTOMATED VERIFIED IN TEMPORARY CI — Slice 1:** a customer can submit a synthetic Abuja/FCT case without an existing parcel/listing and see their own cases. Staff-assisted creation remains later work.
- [x] **IMPLEMENTED / AUTOMATED VERIFIED IN TEMPORARY CI — Slice 1:** `submitted → assigned → in_review → needs_customer_info → in_review → closed/cancelled` is enforced through transactional RPCs with actor, note and timestamp events. `closed` is labelled “Closed — no verification result issued” so closure is not presented as a verification outcome.
- [x] **IMPLEMENTED / AUTOMATED VERIFIED IN TEMPORARY CI — Slice 1:** an active department lead assigns manually; non-leads and cross-department leads are denied. Acceptance/decline/handover and preparer/approver separation remain Slice 3.
- [x] **IMPLEMENTED / AUTOMATED VERIFIED IN TEMPORARY CI — Slice 1:** RLS limits customers to their own cases/customer-safe timeline and staff to department-lead or active-assignment scope; status events are append-only.
- [x] Migration `018` and its original 36-assertion pgTAP suite passed database-security [run 38886400039](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/38886400039). Review hardening expands that suite to 45 assertions; the PR checks are the current evidence for those additions. Hosted review/application remains a separate, deliberately incomplete gate.
- [ ] **IMPLEMENTED IN BRANCH / CI PENDING — Slice 2:** customers can add up to 10 synthetic PDF/JPEG/PNG files to an owned open case; metadata and timeline/audit records are transactionally registered and evidence versions are immutable.
- [ ] **IMPLEMENTED IN BRANCH / CI PENDING — Slice 2:** case-scoped staff retrieval is audited and uses a 60-second attachment URL; cross-customer, cross-department, anonymous, update and delete paths are covered by the new pgTAP suite.
- [ ] **IMPLEMENTED IN BRANCH / CI PENDING — Slice 2:** a case owner can respond from `needs_customer_info` and resume `in_review`; evidence can be added before the response.
- [ ] **NOT HOSTED:** migration `019` must not be applied until review and CI are green and the founder explicitly approves it. Realistic hosted-session storage isolation remains unverified.
- [ ] Verification records have explicit type, status, evidence, source, reviewer, authority and dates.
- [ ] Authority hierarchy is visible; internal review is not represented as official certification.
- [ ] Documents use private storage, authorization before retrieval, validation and controlled access.
- [ ] Version lineage is preserved; important evidence is not silently overwritten.
- [ ] Draft/Submitted/Under Review/Approved/Rejected/Archived transitions are validated and audited.

**Slice 1 evidence:** lint, typecheck, 23 unit tests, 12 configured integration tests, the eight-table RLS guardrail and the production build pass locally. General CI [run 38886399935](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/38886399935) and database-security [run 38886400039](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/38886400039) are green; the latter applied migration `018` and ran pgTAP in a disposable Supabase environment. Three hosted-environment integration tests remain intentionally skipped without test credentials. Hosted migration/application and realistic hosted sessions remain unverified.

**Known Slice 2 limits:** no malware scanning is available in this free-plan cut, so files remain untrusted, download-only and limited to PDF/JPEG/PNG. Evidence is customer-supplied and unauthenticated. Real customer documents remain prohibited pending the privacy/legal readiness gate. Evidence review/findings, staff uploads, handover/escalation and preparer/approver separation remain later work. The privileged `service_role`/database-operator path can still perform exceptional maintenance and must be controlled and audited.

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
- **Private storage:** the hosted foundation bucket is private. Migration `019` replaces user paths with immutable `documents/cases/<case-id>/<evidence-id>/<random>.<ext>` paths and case-scoped RLS when approved and applied.
- **Synthetic fixtures:** demo users/organizations are reproducible, synthetic and labelled `DEMO DATA / NOT OFFICIAL`.
- **Requirement-specific tests:** behavior, persistence, denial paths and recovery states are covered; smoke/source-text checks do not substitute for them.

Current gate state:

| Gate | Status | Evidence / remaining work |
| --- | --- | --- |
| Migrations `015`-`018` deployed | **IMPLEMENTED** | Present in hosted migration history as reported on 2026-10-19. |
| Application foundation RLS enabled | **IMPLEMENTED** | Read-only hosted inspection confirms RLS on four application tables. |
| Private documents bucket/policies | **IMPLEMENTED / AUTOMATED VERIFIED** | Bucket is private; four per-operation policies exist; temporary-environment pgTAP passed. Realistic hosted cross-user isolation remains pending. |
| Organization/profile hardening | **IMPLEMENTED / AUTOMATED VERIFIED** | Policies/triggers are deployed and temporary-environment pgTAP ALLOW/DENY tests passed; hosted-user behavior remains pending. |
| Recovery and email confirmation | **IN PROGRESS** | Code exists; hosted email, redirect, expiry and error behavior remain unverified. |
| Database security tests | **VERIFIED IN TEMPORARY CI** | Database-security run `38276873408` passed. This does not mark hosted authorization verified. |
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
