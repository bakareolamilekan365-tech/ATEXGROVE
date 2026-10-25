# Atexgrove - Requirements and Test Strategy

## Purpose

This document translates the prototype requirements into testable slices. Work should move from isolated business rules, to module integration, to separately tested user flows, and finally to the complete journey.

## Requirement Areas

| ID     | Requirement area              | Acceptance signal                                                                                                            | Primary test level       |
| ------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| REQ-01 | Authentication and onboarding | A user can register, select a role, sign in, persist a session, and recover a password through the planned flow.             | Unit, integration, e2e   |
| REQ-02 | Authorization                 | Server-side permission checks prevent users from reading or mutating data outside their role and organization.               | Unit, integration        |
| REQ-03 | Verification case workflow    | A customer can create and submit a case; authorized staff can queue, assign, hand over, review and change status with audit history. | Unit, integration, e2e   |
| REQ-04 | Evidence and trust             | Every important finding retains evidence, source/authority label, reviewer, date, limitations and unresolved state without fake official status. | Unit, integration, e2e   |
| REQ-05 | Documents                      | Private documents support metadata, controlled access, upload, retrieval and version lineage without public URLs.            | Unit, integration, e2e   |
| REQ-06 | Feasibility and report         | Validated inputs produce deterministic calculations and a reviewed Land & Development Report with explicit assumptions and limitations. | Unit, integration, e2e   |
| REQ-07 | Land discovery and GIS         | After the case workflow is proven, a user can search clearly labelled demo parcels and use maps without implying cadastral authority. | Unit, integration, e2e   |
| REQ-08 | Projects and professionals     | Follow-on project/professional collaboration preserves organization, project-role and professional-responsibility boundaries. | Unit, integration, e2e   |
| REQ-09 | Administration                 | Authorized staff and administrators can perform only their assigned case/review/operations scope and inspect audit events.    | Integration, e2e         |
| REQ-10 | Quality and safety             | The application handles loading, error, empty, responsive, accessible, secret-management and provider-failure cases.          | Integration, e2e, manual |

All demo records must display **DEMO DATA / NOT OFFICIAL**. Planned features must not expose controls that imply they are implemented.

Requirements must also preserve the V2 boundaries: platform role, professional discipline, organization/project role, permission, subscription and entitlement are distinct; verification authority and provenance are explicit; GIS geometry is not automatically legal; private documents are protected; AI is advisory; and payments remain out of prototype scope.

The requirement order above is the accepted delivery priority, not an implementation claim; see [STATUS.md](STATUS.md) for the single current record of implemented slices, hosted deployment, CI evidence and verification gaps.

## Test Layers

### 1. Unit tests: isolated business rules

Location: `tests/unit/`

Test pure logic without Next.js, Supabase, the network, or a browser. Cover feasibility calculations, verification transitions, permission decisions, validation, and GIS helpers.

### 2. Integration tests: module boundaries

Location: `tests/integration/`

Test one module across its service, database, storage, or API boundary using isolated fixtures. Cover auth/profile creation, verification-case persistence, evidence/audit persistence, private document access, staff assignment/review and deterministic feasibility/report behavior. Add land search, project creation and professional membership when their later phases are implemented.

Integration tests must clean up fixtures and must not depend on execution order.

Integration coverage should include provider timeouts/outages, bounded retries, idempotent repeated operations and safe error responses. Document tests must verify authorization before retrieval rather than only checking that a link renders.

### 2a. Database/RLS and authorization tests

The latest visible merged-feature evidence is app run [39950544017](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39950544017): 40 unit tests and 17 integration tests (3 skipped), with lint, typecheck, guardrails and build passing. Database run [39950544756](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39950544756) passed seven pgTAP suites (250 assertions) on disposable Supabase. Migration 023 is hosted per owner confirmation; disposable CI does not verify hosted authorization or realistic hosted-user sessions.

Migration 023's structured `discarded_at` authorization and regression evidence are historical; migration 023 is now hosted per owner confirmation.

The migration 023 branch added a seventh pgTAP suite for draft privacy, evidence, submission, discard and cancellation. Historical run links and counts are retained in [STATUS.md](STATUS.md); current hosted state is recorded there separately.

Migration 024 coverage includes representation authority and contradiction validation, draft-without-number, sequential same-year submission numbers, per-year restart/backfill ordering, replay stability, discarded-draft exclusion, annual-counter RLS and no direct client access, notice version/acceptance, consent idempotency and RLS visibility, direct-write denial and no anon execution. Application tests cover claim validation and field-level error mapping, draft-aware Saved/Received wording, safe next-action mapping, service notice acceptance and evidence guidance. Final PR #27 follow-up app run [39961078177](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39961078177) passed 47 unit and 19 integration tests (3 skipped), lint, typecheck, guardrails and build; database run [39961078498](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39961078498) passed eight pgTAP suites (303 assertions). Migration 024 is recorded in the hosted ledger. PR #28 timeline/evidence tests passed app run [39974685742](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39974685742) (53 unit, 23 integration; 3 skipped; lint, typecheck, guardrails and build) and database run [39974685721](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39974685721) (eight pgTAP suites, 323 assertions). Migration 025 is hosted; migration 026 remains CI-verified and not hosted.

Test the same decisions at the server and database boundaries:

- unauthenticated and unauthorized users
- wrong owner
- wrong organization membership
- wrong project membership or project role
- privilege escalation and changed identifiers (BOLA/IDOR)
- separated administrator responsibilities and scope
- document privacy and alternate download paths
- audit records for sensitive mutations, reviews and access

Foundation authorization tests must exercise both ALLOW and DENY behavior for profiles, organizations, organization membership, audit logs and private storage. Include account-type admin escalation, creator/verification spoofing, owner/admin boundaries, last-owner protection, cross-organization manipulation, wrong-user document access and anonymous access. A test that only searches migration text is not a database security test.

The repository also maintains a permanent RLS guardrail: application-owned tables in the exposed public schema must have an RLS enablement statement, while Supabase-managed system schemas are explicitly excluded. New protected tables are expected to ship with grants, per-operation policies and database tests in the same change.

### 3. E2E tests: separately tested user flows

Location: `tests/e2e/`

Use Playwright first for registration/onboarding, verification-case submission, private document handling, staff assignment/review, report delivery, permission-denied states and recovery from invalid/expired Auth links. Add land discovery, map, and project-workspace journeys when those follow-on slices are implemented. Keep this layer focused rather than duplicating every unit case.

E2E cases should include permission-denied, not-found, loading, empty, timeout/failure and recovery states. Do not treat a visible button or route as evidence of a working feature.

### 3a. Domain and abuse regression cases

Cover verification status transitions including `draft -> submitted`, customer `draft -> cancelled` and customer cancellation from open states; provenance preservation; invalid/oversized/malicious uploads; draft staff isolation for cases, events, evidence and downloads; forged or conflicting evidence; duplicate/retried operations; idempotency where applicable; rate-limit behavior; provider failure and timeout handling; and malicious/untrusted AI or document input. Feasibility tests must prove deterministic calculations and scenario reproducibility.

Authentication recovery tests should cover the generic forgot-password response, safe callback redirects, expired/invalid links and authenticated password updates. Onboarding tests should cover profile persistence beyond role selection and role-aware dashboard authorization. Storage tests must prove private-by-default access and deny path/filename substitution.

### 4. Journey integration gate

The accepted verification-first journey gate combines the modules in this order:

1. Register and select a role.
2. Sign in and load the role-aware dashboard.
3. Start a verification/development-feasibility case without requiring an existing listing or parcel.
4. Record Abuja/FCT site and request details.
5. Upload synthetic or properly redacted private evidence.
6. Submit the case.
7. Confirm that authorized staff can see the case in the work queue while unauthorized users cannot.
8. Have a human lead assign or hand over the case; automation may recommend but must not silently assign.
9. Record evidence source, review state and authority level; request clarification where needed.
10. Enter validated, explicit feasibility assumptions.
11. Generate a draft Land & Development Report with exact evidence/version lineage.
12. Require genuinely separate discipline-appropriate review for consequential conclusions.
13. Deliver the report with limitations, unresolved matters, source/authority labels and audit history.
14. Verify permission-denied, safe-error, not-found and expired-session states.
15. Test land discovery/GIS later as a separate Phase 4 gate after the case/report workflow is proven.

This gate uses real application boundaries and seeded demo data. It fails on fake success states, unauthorized access, missing persistence, broken navigation, or unlabeled synthetic data.

## Commands

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
npm test
```

`npm test` runs unit, integration, and E2E tests in that order. A failing earlier layer blocks the later layer.

## Definition of Ready

- The requirement has an acceptance signal.
- The owning module and data boundary are identified.
- Fixtures and test data are explicitly synthetic.
- Authorization and error cases are named.

## Definition of Done

- Unit tests cover business rules and edge cases.
- Integration tests cover persistence and authorization boundaries.
- Critical user flows have Playwright coverage.
- The journey integration gate passes against the real prototype services.
- Typecheck, lint, and tests pass in CI.
- No secrets or private documents are committed.

## Release gate

```text
Feature works
AND authorization works
AND persistence works
AND tests cover important paths
AND failure behavior is understood
AND security boundaries are preserved
```

The gate does not require unrealistic 100% coverage. It does require evidence for data exposure, trust-state changes, administrative actions and any future money movement before those capabilities are released.
