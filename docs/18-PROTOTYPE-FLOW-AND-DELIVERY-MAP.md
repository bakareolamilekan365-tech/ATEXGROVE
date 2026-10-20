# Atexgrove - Prototype Flow and Delivery Map

## Payment Decision

No payment service is required for the current prototype.

The prototype does not collect money, sell subscriptions, process land purchases, charge professionals, or manage construction payments. Land prices, feasibility revenue, and cost figures are demo estimates only.

Do not add Stripe, Paystack, Flutterwave, or another payment provider yet. Reserve a `PaymentProvider` adapter for a later phase so a real provider can be added without changing project, land, or accounting domains.

## Primary User Flow

```mermaid
flowchart TD
    A[Visitor opens Atexgrove] --> B{Has account?}
    B -->|No| C[Register with email and password]
    B -->|Yes| D[Sign in]
    C --> E[Confirm email if required]
    E --> D
    D --> F[Load role-aware dashboard]
    F --> G[Stage 1: Request received / start case]
    G --> H[Record Abuja site and request details]
    H --> I[Stage 2: Upload synthetic/redacted private evidence]
    I --> J[Submit case]
    J --> K[Authorized staff work queue]
    K --> L[Assign or hand over case]
    L --> M[Stage 3: Document checks and trust labels]
    M --> N{More evidence required?}
    N -->|Yes| O[Request clarification or documents]
    O --> I
    N -->|No| P[Stage 4: Contextual site/map review]
    P --> Q[Stage 5: Validated development options]
    Q --> R[Generate draft report and require separate qualified review]
    R --> S[Stage 6: Deliver report with findings and limitations]
    S --> T{Continue into later product flows?}
    T -->|Land discovery| U[Open clearly labelled demo list or map]
    T -->|Project| V[Create controlled project workspace]
    T -->|No| F
```

This is the accepted controlled-pilot delivery direction. It is not a claim that the case or report workflow is already implemented.

## System Boundary Flow

```mermaid
flowchart LR
    Browser[Next.js browser UI] --> Client[Supabase browser client]
    Browser --> Server[Next.js server actions and routes]
    Server --> Session[Supabase SSR session]
    Client --> Auth[Supabase Auth]
    Session --> Auth
    Server --> Database[(PostgreSQL + PostGIS)]
    Server --> Storage[(Private Supabase Storage)]
    Case[Verification case and report UI] --> Server
    Map[Later MapLibre UI] --> Tiles[Map tile adapter]
    Map --> GeoJSON[Demo GeoJSON]
    Database --> RLS[Row-level security]
    Storage --> RLS
```

## Responsibility map

| Journey stage | Boundary that matters |
| --- | --- |
| Login/onboarding | Supabase Auth establishes identity and session; profile/role data is not a complete permission grant. |
| Verification | Structured type/status/evidence/reviewer/source; authority hierarchy remains visible and auditable. |
| Documents | Private storage, metadata/version checks and authorization before preview/download; no guessable public URL. |
| Feasibility | Deterministic inputs/rules/outputs, reproducible scenarios and clear estimate/uncertainty labels. |
| Admin/review | Separated responsibilities, least privilege, scope and audit logging for sensitive actions. |
| Later land discovery | Server/API validation, bounded pagination and DEMO DATA / NOT OFFICIAL labels; GIS is visual/platform data unless authority is explicit. |
| Later parcel/details | PostGIS/GeoJSON query plus source, jurisdiction and data-as-of; it is not a Phase 2 case prerequisite. |
| Later project/professionals | Organization/project membership and project role checks; professional discipline is not a permission. |

Every vertical slice must pass through the relevant server/business, database/RLS, storage and test boundaries. A screen alone is not a completed feature.

## Delivery Phases

### Phase 0 - Design lock

**Output:** approved requirements, wireframes, design tokens, domain ownership rules, and test cases.

**Exit gate:** every must-work feature has an acceptance signal and a named test layer.

### Phase 1 - Foundation

**Output:** repository, environment, Supabase project, migrations, RLS, sessions, registration, login, role selection, and dashboard shell.

**Current status:** see [STATUS.md](STATUS.md) for implemented slices, hosted deployment/configuration, automated evidence and remaining operational gaps. Docker is only needed for local Supabase testing; GitHub Actions can provide the disposable database-test environment.

### Phase 2 - Verification case and private evidence

**Output:** customer request, internal work queue, assignment/handover, status history, reviewer notes, private evidence, and audit events.

**Exit gate:** a customer can submit a case and authorized staff can process it without public documents, cross-case access, silent reassignment, or fake verification claims.

### Phase 3 - Feasibility and Land & Development Report

**Output:** deterministic assumptions/calculations, source and authority labels, reviewed report generation, delivery, and explicit limitations.

**Exit gate:** the report is reproducible, reviewable, access-controlled, and honest about estimates, sources, authority, and unresolved matters.

### Phase 4 - Controlled land discovery and GIS

**Output:** synthetic Abuja parcel data, search/filter, list/map toggle, site/parcel detail, PostGIS/GeoJSON integration, and provenance labels.

**Exit gate:** a signed-in user can discover clearly labelled demo parcels without the map implying cadastral or legal authority.

### Phase 5 - Projects, professionals, and scoped admin

**Output:** project workspace, membership rules, professional directory/involvement, project documents, scoped administration, and audit review.

**Exit gate:** a completed case or parcel can move into a permission-checked project workspace, and each administrator can perform only their granted scope.

### Phase 6 - Integration and release confidence

**Output:** replace remaining reserved tests with real unit/integration/E2E coverage, keep migrations and pgTAP green in Docker-capable CI, verify the hosted environment separately, complete responsive/accessibility and error-state review, and produce a deployable preview.

**Exit gate:** `npm test`, typecheck, lint, build, and the complete Playwright journey pass without fake success states.

Payments, subscriptions and entitlement checks are not part of the current prototype. Do not add checkout, payment credentials or financial state to this journey.

## Execution Rule

Work in vertical slices. For each phase:

1. Define the data and permission contract.
2. Write the unit and integration tests.
3. Implement the server and database boundary.
4. Implement the UI states.
5. Add the E2E path.
6. Run the phase exit gate before starting the next phase.

Do not build disconnected screens ahead of the data boundary they depend on.

## Future extension points

The completed prototype leaves explicit, non-implemented extension points for planning, approvals, construction, property management, finance/payments, AI-assisted analysis, mobile GPS/photo/document capture with future offline synchronization, and urban intelligence. These extensions must reuse the backend authorization, provenance, audit and provider-adapter boundaries rather than bypassing them.
