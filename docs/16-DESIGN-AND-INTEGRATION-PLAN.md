# Atexgrove - Design and Integration Plan

## Purpose

Design decisions should be settled before feature implementation. This plan defines the design deliverables, the external accounts required for the prototype, and the free-first integration boundary.

Free tiers are suitable for development and demonstration when quotas, attribution, privacy, and rate limits are respected. The application must keep providers behind adapters so changing a provider does not require rewriting domain logic.

### Supabase plan boundary

The first prototype remains on the Supabase Free plan. Leaked-password protection is an accepted Pro-only limitation for the current prototype and must be reassessed before production or a plan change. See [STATUS.md](STATUS.md) for the current hosted/advisor record. Any future feature that requires Pro must be labelled **PRO PLAN REQUIRED** in the relevant checklist before it becomes a commitment; upgrading the plan requires a separate cost decision.

## Integration inventory

### Current / near-term

- **GitHub** — source control, reviews and CI.
- **Supabase** — PostgreSQL/PostGIS, Auth, RLS and private Storage.
- **Map stack (Phase 4; optional earlier context only)** — MapLibre and a replaceable tile/data provider when map implementation genuinely needs it. A provider is not a prerequisite for Phase 2.
- **Vercel** — future preview/deployment target when the local journey is ready.
- **Email provider** — later; begin with Supabase Auth email for development.
- **Monitoring/observability** — later, after privacy/consent and event boundaries are defined.

The prototype does not require every future API domain, external authority feed or paid provider.

## Design Gate Before Implementation

### 1. Product and requirements baseline

- Confirm the prototype journey in `00-PROJECT-CONTEXT.md`.
- Confirm must-work features versus planned features in `01-PRD.md`.
- Assign each requirement an owner, acceptance signal, and test layer in `15-REQUIREMENTS-AND-TEST-STRATEGY.md`.

### 2. Domain and data design

- Confirm ownership and membership rules for every domain.
- Confirm the case-first relationship: a verification case starts from customer/request and site details without requiring a listing or parcel; any later parcel/project link is optional.
- Confirm document metadata, versioning, private storage, and audit records.
- Confirm jurisdiction, provenance, and `DEMO DATA / NOT OFFICIAL` fields for synthetic data.
- Review migrations and RLS policies before building large screens.

### 3. Experience design

Create low-fidelity flows before polished implementation for:

- Registration, role selection, and onboarding
- Role-aware dashboard
- Verification/feasibility case request and private document submission
- Internal work queue, assignment, handover, evidence review, and audit history
- Land & Development Report review and delivery
- Site-location map within a case, followed later by land list, filters, map, and parcel detail
- Project creation, workspace navigation, professional search, and project membership after the first report workflow
- Admin/reviewer management and audit review

For each flow, specify loading, empty, error, permission-denied, not-found, and success states. Planning and other future modules must show an honest planned state rather than an interactive fake.

### 4. Visual system

- Confirm typography, color tokens, spacing, forms, tables, cards, tabs, dialogs, and map states.
- Use accessible semantic controls, visible focus, keyboard navigation, and sufficient contrast.
- Keep information density appropriate for repeated operational work rather than a marketing landing page.
- Produce responsive wireframes for desktop, tablet, and mobile before implementation.

### 5. Technical contracts

Before implementing a module, define:

- Server action/API input and output types
- Validation schema and error shape
- Permission checks and ownership rules
- Database/storage operations
- Audit events
- Unit, integration, and E2E acceptance cases

## Accounts Required

### Required now

| Service           | Use                                        | Free-first decision                                                                                                                                       | Signup timing             |
| ----------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| GitHub            | Source control and GitHub Actions          | Already configured. Public repository Actions are suitable for CI.                                                                                        | Complete                  |
| Supabase          | PostgreSQL, PostGIS, Auth, private Storage | Connected. Keep service-role keys server-side; current hosted configuration and verification gaps are maintained in [STATUS.md](STATUS.md). | Connected; verification gaps remain |
| Map tile provider | Phase 4 basemap/vector tiles for MapLibre | Do not require one for Phase 2. Use a compliant free developer/public option only when a contextual case map or Phase 4 implementation genuinely needs it, behind a map adapter. | Optional contextual map; otherwise before Phase 4 |

Docker is required only to run the local Supabase stack and pgTAP database tests; it is not required to connect to or push reviewed migrations to hosted Supabase. GitHub Actions supplies a Docker-capable runner for those database tests. Neither mechanism replaces hosted configuration checks or end-to-end Auth email testing.

### Useful later, not required for the first design or database work

| Service                           | Use                                             | Free-first decision                                                                                 |
| --------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Vercel                            | Next.js preview/production deployment           | Use the free tier when the app shell is ready. Local development does not require an account.       |
| Resend or Supabase email provider | Transactional email and password-reset delivery | Start with Supabase Auth email for development; add a provider only when real delivery is required. |
| Sentry                            | Error monitoring                                | Add the free tier after the first deployed prototype. Do not block local work on it.                |
| PostHog                           | Product analytics                               | Optional and deferred until privacy, consent, and event definitions are approved.                   |

### Do not sign up for yet

Do not add Stripe, Google Maps, Auth0, Cloudinary, OpenAI, paid GIS datasets, or a separate file-upload vendor for the prototype foundation. Supabase covers the initial database, authentication, and private document storage; MapLibre keeps the map rendering layer open.

### Payment decision

Payments are out of scope for the prototype. No payment provider account is required until Atexgrove has a defined paid transaction, subscription, professional fee, or marketplace workflow. Keep a future `PaymentProvider` adapter in the architecture, but do not add payment credentials or checkout UI now.

When payments eventually arrive, preserve this boundary:

```text
user → Atexgrove server → payment provider → verified webhook
→ subscription state → entitlement
```

The future commercial domain should include provider abstraction, verified webhook signatures, idempotency, transaction/invoice/payment-event records, refunds, disputes and fraud controls. Never store raw card data. Role, subscription and entitlement remain separate.

## Future adapter inventory

Keep these behind interfaces/adapters and out of core domain models:

- payment providers
- verification providers
- government/authority data
- GIS/tile/data providers
- AI providers
- notification/email providers
- professional registry sources
- external market and cost data

Provider outages, timeouts, retry/backoff rules and source/provenance metadata must remain visible at the boundary. Long-running provider work should use future background jobs rather than blocking ordinary request paths.

## Privacy, transfers and operations

Before adding third-party processors, review data minimization, access control, retention/deletion, international transfers, consent and applicable Nigerian privacy/regulatory obligations. Add monitoring and alerting without putting sensitive document contents or secrets into logs. This plan is architectural guidance, not legal advice.

## Development Extensions

These improve the workflow and do not require external service accounts:

- ESLint
- Tailwind CSS IntelliSense
- Playwright Test for VS Code
- GitHub Pull Requests and Issues (optional)

The extension list is convenience tooling, not part of the runtime architecture. A developer must still be able to run the project from the documented npm commands.

## Environment Boundary

Only provider configuration belongs in environment variables. Start from `.env.example` and never commit `.env.local` or provider secrets.

Expected future variables include:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_MAP_STYLE_URL
NEXT_PUBLIC_MAPTILER_KEY
```

Public map keys still need domain restrictions and quota monitoring. Server-only credentials must never be exposed to browser code.

## Free-Tier Quality Rules

- Use adapters for maps, email, monitoring, and future AI providers.
- Cache or import stable demo GeoJSON instead of geocoding every page load.
- Add attribution and respect each provider's terms and rate limits.
- Do not use public services for private documents or sensitive user data.
- Track quota failures as explicit error states.
- Keep provider-specific types out of domain entities.
- Record the data source, jurisdiction, collection date, and verification state for spatial data.

## Recommended Order

1. Approve the requirements and flow/wireframe set.
2. Create the Supabase project and local environment variables.
3. Define migrations, RLS, storage buckets, and seed fixtures.
4. Implement the design tokens and application shell.
5. Implement auth and permissions with unit/integration tests.
6. Close the remaining foundation operational/security evidence without reopening the accepted product order.
7. Implement the verification-case and private-evidence vertical slice, including work queue, human-led assignment, review state/authority labels and audit history.
8. Implement deterministic feasibility and the limited, separately reviewed Land & Development Report.
9. Add controlled land discovery and GIS through the map adapter in Phase 4; a limited contextual case map may be added earlier only when genuinely needed.
10. Add projects and professionals as the later Phase 5 slice.
11. Replace reserved test placeholders with requirement-specific tests and complete integration/release-confidence gates.
12. Connect preview deployment and monitoring only after the relevant local journey works.
