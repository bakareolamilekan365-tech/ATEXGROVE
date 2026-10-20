# Atexgrove — Roadmap

The roadmap separates the working prototype from future architecture. A phase is not complete because a screen exists: the relevant persistence, authorization, failure handling, tests and trust boundaries must work together.

**Planning status (updated 2026-10-14):** the verification-first Abuja/FCT controlled-pilot order is accepted in `DECISIONS.md`. Open questions may refine staffing, report wording, policy and data sources, but new implementation should not revert to a marketplace-first sequence without recording a replacement decision.

## Phase 0 — Architecture / Design Lock

- Confirm the prototype journey, domain boundaries and role/discipline/organization/project-role separation.
- Lock the modular-monolith approach, provider-adapter seams, provenance model and document security lifecycle.
- Define requirement IDs, acceptance signals, RLS/authorization rules, synthetic-data policy and test layers.
- Identify jurisdiction, privacy and regulatory questions requiring domain or legal input.

**Gate:** every must-work capability has an owner, data/permission contract, current-vs-future label and test plan.

## Phase 1 — Foundation

- Repository, environments, Supabase project, migrations and seed process.
- Supabase Auth, profile/onboarding flow, sessions and initial role-aware dashboard.
- Core UI system, server-side business boundaries, RLS and audit-log foundation.

**Gate:** a signed-in user can complete the foundation flow against real persistence; secrets remain outside source control.

**Current status:** see [STATUS.md](STATUS.md); this roadmap defines sequencing and gates rather than duplicating implementation or deployment evidence.

## Phase 2 — Verification Case + Private Evidence

- Customer request, internal work queue, assignment, handover, status transitions and reviewer notes.
- Private document submission, controlled retrieval, metadata/version lineage and audit events.
- Evidence source, authority, jurisdiction, reviewer, date and unresolved-state labels.

**Gate:** a customer can submit a case and evidence; authorized staff can process it without public document URLs, cross-case access, silent reassignment or fake verification claims.

## Phase 3 — Development Feasibility + Report

- Deterministic feasibility inputs, assumptions, calculations and limitations.
- Reviewed Land & Development Report generation and delivery.
- Explicit separation of supplied information, professional checks, authoritative confirmation, estimates and unresolved matters.
- Site location inside the case; mapping is contextual and does not imply cadastral or legal authority.

**Gate:** the report is reproducible, reviewable, access-controlled and honest about every source, estimate, limitation and authority boundary.

## Phase 4 — Controlled Land Discovery + GIS

- Synthetic land discovery, filters, list/map views, parcel detail and PostGIS/GeoJSON integration.
- Source, jurisdiction, data-as-of and visual-versus-authoritative GIS labels.
- Spatial indexes and viewport loading where needed for real data volume.

**Gate:** users can discover and open clearly labelled DEMO DATA / NOT OFFICIAL parcels without implying cadastral authority or bypassing the verification service.

## Phase 5 — Projects + Professionals

- Create projects from parcels or completed cases, with project membership/roles and project documents.
- Add a professional directory and controlled professional involvement.
- Preserve organization/project scope, professional responsibility boundaries, scoped administration and audit review.

**Gate:** a case or parcel becomes a persisted, permission-checked project workspace; professionals and administrators can perform only their granted scope.

## Phase 6 — Integration + Release Confidence

- Replace placeholder tests with meaningful unit, integration, RLS/authorization and E2E coverage.
- Responsive/accessibility review, error/empty/loading states, observability and deployment preview.
- Verify backup/recovery, rate limits, private storage controls and release documentation as operational work matures.
- Run migrations and pgTAP tests in a Docker-capable CI environment when local hardware is constrained; Kubernetes is not required.

**Gate:** feature behavior, persistence, authorization, tests, failure behavior and security boundaries all pass review.

## Future Product Expansion

Reserved domains, not current prototype scope:

- planning intelligence and jurisdiction rules
- approval workflows
- construction management, BOQ, tendering and procurement/suppliers
- property management
- education and professional networking
- analytics
- finance and payments
- mobile/offline field workflows

## Future Ecosystem Expansion

- External authority and professional-registry integrations
- GIS, survey, environmental and market-data providers
- Notifications, email and monitoring services
- Multi-country and jurisdiction-specific expansion

Providers remain behind replaceable adapters. External data must retain provenance and authority distinctions.

## Future Intelligence Platform

- AI-assisted document/data analysis
- Advanced GIS and urban intelligence
- Aggregated/anonymized development datasets
- Background processing for large GIS, reports, imports, notifications and analytics

AI remains advisory, uncertain where appropriate and subordinate to qualified professionals and official authorities.

## Cost and quality rules

- Start with free/low-cost services and synthetic/local data; pay for external providers only when the use case, privacy, quota and operational value justify it.
- Add quality, security, privacy and compliance gates to every phase; progress is not feature count alone.
- Payments/subscriptions remain future. When added, keep role, subscription and entitlement separate and require verified webhooks and idempotency.
- Do not prematurely split the modular monolith into microservices; extract bounded services only when scale or ownership requires it.
