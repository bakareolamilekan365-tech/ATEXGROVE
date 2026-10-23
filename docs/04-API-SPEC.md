# Atexgrove — API Architecture

## Principles
- Consistent JSON response shapes
- Typed request/response schemas
- Authentication and authorization on every protected read and mutation
- Validation before database writes
- Domain errors mapped to safe HTTP responses
- No direct client access to privileged operations
- API routes/server actions remain inside the modular monolith; they are not a commitment to microservices.

## Prototype boundary

The API areas below describe logical boundaries; they are not a promise that every conceptual REST route exists. The current repository implements a verification-case workflow through Next.js server actions and secured Supabase RPCs rather than a complete REST API. Customer case creation requires a signed-in user and a form-generated UUID idempotency key: the same key and same normalized request returns the existing case, while reusing the key with materially different data is rejected (migration `021`, hosted since 2026-10-21). Migration 022 expands the RPC inputs to `p_site_description`, `p_area_lga`, `p_area_name`, `p_area_is_listed`, `p_address_line`, `p_customer_notes`, `p_contact_preference`, `p_contact_phone`, `p_contact_phone_consent`, `p_idempotency_key`; it validates councils and listed areas and normalizes a consented Nigerian phone number. Migration 022 is implemented and CI-verified in runs [39909627609](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39909627609) and [39909627678](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39909627678), but is not hosted. Case creation does not require a marketplace listing or existing parcel. Planning, approvals, construction, billing, public land discovery/GIS and AI endpoints remain later work until implemented and tested.

## Request security pipeline

For every protected request:

1. Establish the Supabase Auth identity and session.
2. Validate the request body, query parameters, path identifiers and content type.
3. Authorize ownership, organization membership, project membership, permissions and jurisdiction/scope before business logic.
4. Perform an object-level check against the requested record to prevent BOLA/IDOR; never trust an identifier supplied by the browser.
5. Execute the domain operation and database transaction.
6. Write an audit event for sensitive reads, downloads, reviews, administrative actions and mutations.

Frontend route guards and hidden controls are not authorization. Server-side checks and database RLS must remain the security boundary.

## API areas

### Current foundation boundaries

- `/api/auth` or equivalent Supabase SSR/server actions
- `/api/profile`
- `/api/organizations`

The exact implementation may use Next.js server actions rather than route handlers. The security contract is the same.

### Phase 2/3 case-first boundaries (Conceptual; implemented behavior noted)

- `/api/cases`
- `/api/cases/[id]`
- `/api/cases/[id]/submit`
- `/api/cases/[id]/evidence`
- `/api/cases/[id]/assignments`
- `/api/cases/[id]/reviews`
- `/api/cases/[id]/history`
- `/api/cases/[id]/feasibility`
- `/api/cases/[id]/report`
- `/api/staff/work-queue`

These names are conceptual and may be adapted to the existing Next.js modular-monolith architecture. Case creation accepts customer/request, jurisdiction and site details directly. Any later `land_parcel` or listing relationship is optional and must not become a hidden prerequisite.

Each case boundary must enforce authentication, server-side authorization, object-level authorization, validated state transitions, RLS, audit events for sensitive operations and safe errors. Staff-assisted creation also records customer, staff actor, channel and consent. Assignment is confirmed by a human lead; automation may recommend but must not silently assign or approve.

In migration 022, `assign_verification_case(uuid, uuid, text)` writes exactly one fixed customer-visible `status_change` and one private `staff_note`; the customer-visible text is “A reviewer has been assigned to your case.” The assignment note is never exposed to customers. The sign-out server action is submitted through a POST form, calls Supabase `signOut({ scope: "local" })`, and redirects to `/login`. No idle timeout exists; its policy remains undecided.

### Later-phase boundaries (Planned/Future)

- `/api/land` and `/api/land/[id]` (Phase 4 discovery/GIS)
- `/api/properties`
- `/api/projects` and project subresources
- `/api/professionals`
- `/api/notifications`
- scoped `/api/admin` capabilities

Phase 2 does not require a map provider. A limited contextual site map may be added through a replaceable adapter when genuinely useful, without introducing parcel discovery or implying cadastral/legal authority.

## Example
### POST /api/cases (Conceptual example — no REST route is implied)
Request:
```json
{
  "jurisdiction": "NG-FC",
  "site_description": "DEMO DATA / NOT OFFICIAL — Kuje site",
  "request_summary": "Document intake and development-feasibility review"
}
```

Response:
```json
{
  "data": {
    "id": "uuid",
    "current_stage": "request_received",
    "workflow_status": "draft"
  },
  "error": null
}
```

## Errors
Use a consistent structure:
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "details": {}
  }
}
```

Do not leak internal database or provider errors to end users.

## Query and operation behavior

- Collection endpoints should support explicit pagination (cursor or bounded page/limit), stable sorting and validated filtering.
- Default limits must protect the database; clients must not request unbounded lists or full document bodies in normal list responses.
- Use request correlation IDs and safe error codes without exposing secrets, SQL, storage paths or provider internals.
- Apply rate limits to authentication, uploads, search, exports and expensive calculations. Return a retry hint only when safe.
- Timeouts are failure boundaries, not a substitute for performance work. Provider calls should fail gracefully and surface an actionable error state.
- Retries must be bounded and use backoff where appropriate. Mutations that can be repeated need idempotency keys or equivalent deduplication; never blindly retry future financial operations.

## Long-running work

AI document analysis, large GIS processing, report generation, bulk imports, notifications and analytics may become asynchronous jobs. A future job API should expose queued/running/succeeded/failed/cancelled state, safe retry metadata and idempotency without making the current prototype depend on a job platform.

## Sensitive resources

Document endpoints must authorize the related verification case first during Phase 2, including customer relationship, assigned responsibility and administrative scope. Later organization, project or parcel relationships may extend that decision. Use private storage and short-lived signed/controlled access; never return guessable public URLs. Verification and administrative operations should include reviewer/actor context and audit metadata.

## Integration interfaces
Future external providers should be accessed through adapters, for example:
- `PaymentProvider`
- `MapTileProvider`
- `AIProvider`
- `VerificationProvider`
- `NotificationProvider`

The prototype may implement only the internal/default adapter. Provider-specific SDK types, webhook payloads and failure semantics must not leak into core domain models. A future mobile client should call the same server API/business rules as the web client.

Payment remains out of prototype scope. When introduced, payment routes must sit behind a `PaymentProvider` adapter and separate plans, subscriptions, entitlements, transactions, invoices, refunds, disputes, webhook verification and idempotency from identity/authorization.
