# Atexgrove — System Architecture

## Architecture style
Use a modular monolith for the prototype. Keep domain boundaries clean so modules can later become independently deployable services if scale requires it.

## Recommended stack
### Frontend / application
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui or equivalent accessible component primitives

### Backend
- Next.js server actions/API routes where appropriate
- Supabase for PostgreSQL, authentication and storage
- PostGIS for geospatial data

### Maps
- MapLibre GL JS
- GeoJSON for initial demo layers
- External vector-tile/style provider for the prototype

### Validation
- Zod or equivalent schema validation

### Testing
- Vitest for unit tests
- Playwright for key end-to-end flows

## High-level flow
Browser
→ Next.js application
→ server-side application logic
→ Supabase Auth / PostgreSQL / PostGIS / Storage

External integrations should be isolated behind adapters/interfaces.

## Domain boundaries
- Identity & access
- Profiles & organizations
- Land
- Verification
- GIS
- Projects
- Professionals
- Documents
- Feasibility
- Notifications
- Administration

The boundaries are domain responsibilities, not a claim that every module is currently implemented. The repository is a modular monolith: keep the boundaries explicit in application/service code and database contracts, but do not prematurely split the prototype into microservices.

## Authorization model

Authorization is a decision over more than a role label. It should consider:

- resource ownership
- organization membership and organization role
- project membership and project role
- administrative permission and administrative scope
- jurisdiction or other relevant scope
- least privilege

Checks must run server-side and be reinforced with database Row Level Security. Client-side navigation and visibility are convenience mechanisms, not security boundaries. Administrative actions should be recorded in an auditable log with actor, action, target, scope, time and relevant result/metadata.

### Multiple administrators

The platform must not have an unrestricted Super Admin. The future administration model separates responsibilities such as Operations, Verification, Compliance, Finance/Billing and Support administration, with an explicitly scoped CEO application-administrator function where approved. Corporate/executive authority does not automatically grant technical permissions. These are target responsibilities, not November accounts or implemented controls; every permission must be deliberate, resource-scoped and auditable. The current restricted staff/lead authorization and RLS remain the November as-built model. A future role/permission matrix and mapping from the current department fields to the approved organizational hierarchy require separate governance review before implementation.

## Verification and authority

Verification is its own trust subsystem rather than a single badge. It should support distinct verification subjects and types, including identity, organization, professional, land/document, survey-related, title/ownership and planning-related checks. Records should be able to reference status, evidence, reviewer, source, dates, expiry and confidence.

The subsystem must preserve an authority hierarchy: user-submitted information → automated checks → Atexgrove internal review → professional review → authoritative third-party confirmation → official/statutory confirmation. Internal review must not be represented as government certification. GIS geometry should distinguish visual/spatial representation from survey information, authoritative cadastral information and official/legal records.

## Provenance and data trust

Important land, GIS, document and verification data should be designed to retain source, source type, supplied by, collection/import date, verification date, reviewer, last updated time, jurisdiction, confidence and verification state. Provenance belongs alongside the domain record so later workflows can explain why information is trusted and when it may have gone stale.

## Private documents

Documents are sensitive assets. The intended pipeline is:

```text
upload → validation/security checks → private storage → metadata → versioning
→ controlled access → review → audit → retention/deletion
```

Storage paths and metadata must follow the permissions of the related land, project or organization. Sensitive documents must not be served from public URLs. Retention and deletion must be deliberate and jurisdiction-aware.

## External provider adapters

Future integrations should sit behind stable interfaces/adapters, for example `PaymentProvider`, `VerificationProvider`, `MapTileProvider`, `AIProvider` and `NotificationProvider`. Provider-specific SDK types, webhooks and failure semantics should not leak into core domain models. The prototype may use a single provider, but the boundary should remain replaceable.

## Scalability principles

The prototype should stay simple while leaving clear extension points for indexing, pagination, query optimization, caching, connection management, spatial indexes, viewport-based GIS loading and avoiding N+1 queries. Horizontal scaling can be introduced where actual load requires it; it is not a reason to over-engineer the current monolith.

## Resilience and asynchronous work

Network calls and provider operations should anticipate timeouts, bounded retries, backoff where appropriate, provider outages, graceful failure and idempotency. A timeout is not a performance solution, and financial operations must never be blindly retried. Long-running work should have an asynchronous/background-processing extension point for AI document analysis, large GIS processing, report generation, bulk imports, notifications and analytics.

## Future clients and capabilities

- A future mobile client, especially for construction field operations, should share the backend, authentication, authorization, business logic, APIs and documents/data model with the web client.
- Future field workflows may support local capture → offline work → synchronization → conflict handling. Offline synchronization is not implemented in the prototype.
- AI is an isolated assistive capability, not an official authority. It must separate facts from estimates, communicate uncertainty, avoid inventing missing information, treat uploaded content as untrusted and defer to qualified professionals or official authorities.
- Payments/subscriptions are a separate future domain. Plans, subscriptions, entitlements, transactions, invoices, payment events, refunds, disputes, webhook verification and idempotency must not be conflated with roles or permissions and are out of prototype scope.
- The architecture must remain conscious of Nigerian data protection/privacy, personal-data lifecycle, third-party processors, international transfers where relevant, consumer protection, payment regulation, land administration, planning, building regulation, professional regulation and jurisdiction-specific rules. This is architectural awareness, not legal advice.

## Future boundaries
Planning, approvals, construction, procurement, finance, property management, education, analytics and urban intelligence should have reserved domain boundaries but should not be implemented as fake modules in the prototype.

## Core design principle
Business rules should live in domain/service layers, not inside large UI components.
