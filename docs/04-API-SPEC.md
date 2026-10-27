# Atexgrove — API Architecture

## Explicit evidence submission — migration 026 compatibility

Staff transitions from `needs_customer_info` permit only `closed` or `cancelled`, never `in_review`. The customer's explicit reply is the only resumption path and atomically releases all pending evidence; closure/cancellation keep it private. Customers can upload only in `draft` or `needs_customer_info`, and must wait for a staff request after submission.

The last independent read-only hosted check reached 025 on 2026-10-25. Migration 026 and compatible application code are merged, and 026 is subsequently owner-confirmed hosted; no apply timestamp or fresh independent ledger inspection is claimed. Earlier proposed-025/026 descriptions below are historical.

- `register_case_evidence` keeps its nine arguments and validation/lineage/quota checks. It now accepts only owned, non-discarded `draft` or `needs_customer_info` cases. Successful registration saves pending evidence and a creation audit, with no event or review release.
- `submit_verification_case(uuid,text,boolean)` keeps its consent and numbering contract; successful first submission releases every pending file and writes a single submitted milestone. A retry never releases additional files.
- `customer_respond_to_case(uuid,text,uuid)` replaces the two-argument RPC. The third argument is `p_request_event_id`, obtained from the owner-visible case. The response message remains required (2–2000 trimmed characters). It must match the current request; an identical previous response returns the existing event, while different data is rejected. The release, one response milestone, status transition and audit commit together. Old app builds fail closed because the two-argument RPC is removed.
- `authorize_case_evidence_download(uuid)` retains its signature but requires both submitted evidence and current staff case scope. The admin signer is only reached after that check.

The existing hosted project must not reapply migration 026. Any isolated staging project must apply the reviewed sequence through 026 before running this application version; use the target-verification process in RUNBOOK. This documentation PR performs no database operation.

## November evidence-upload application boundary

The repository implementation uses this sequence for private evidence:

1. The browser validates required metadata, the 10 MiB ceiling, allowed MIME and the PDF/JPEG/PNG signature for immediate feedback.
2. The signed-in customer's Supabase browser client uploads the binary directly to the private `documents` bucket with `upsert: false` and a generated `documents/cases/<case-id>/<evidence-id>/<random-id>.<ext>` path.
3. Migration 026 Storage INSERT RLS authorizes the owning customer and eligible `draft` or `needs_customer_info` state.
4. The browser calls a Next.js finalization action with metadata and the generated path only. No `File`, `Blob`, multipart binary body or Base64 file enters the action.
5. The server authenticates again and revalidates ownership, state, filename, MIME, size and exact case/evidence/path binding.
6. The server-only Storage boundary checks authoritative object metadata and fetches only bytes 0-7 with HTTP Range to validate the stored signature.
7. Only then does the server call the unchanged `register_case_evidence` RPC; the evidence remains pending under migration 026 semantics.
8. Verification or registration failure causes best-effort server-only object cleanup and safe customer copy.

`register_case_evidence` remains the authoritative database registration, registered-count, version-lineage and audit boundary. Direct authenticated Storage SELECT, UPDATE and DELETE remain unavailable. Staff download authorization and signing are unchanged, and the service role never enters browser code. Standard direct upload is the November transport; TUS is a later fallback only if deployed 9-10 MiB staging tests show unacceptable reliability.


## Principles
- Consistent JSON response shapes
- Typed request/response schemas
- Authentication and authorization on every protected read and mutation
- Validation before database writes
- Domain errors mapped to safe HTTP responses
- No direct client access to privileged operations
- API routes/server actions remain inside the modular monolith; they are not a commitment to microservices.

## Prototype boundary

The API areas below describe logical boundaries; they are not a promise that every conceptual REST route exists. The current repository implements the verification-case workflow through Next.js server actions and secured Supabase RPCs rather than a complete REST API. Case creation requires a signed-in user and form-generated UUID idempotency key. Migration 023 (hosted per owner confirmation) creates private drafts, allows optional pre-submit evidence and owner-only submit/discard/cancel. Hosted migration 024 replaces the create signature with 15 parameters, adding customer intent, claimed land relationship and representation/authority details; replay comparison includes these new values. It rejects `representing_someone` when `acting_for` is `self`; the other representation options require principal name and confirmed authority. Submission is `submit_verification_case(uuid,text,boolean)`: it requires the current service-scope notice version and affirmative acceptance, records one consent, allocates an annual case number and submits idempotently. Drafts receive no number; concurrent allocations serialize on the counter row for that submission year, using the Africa/Lagos calendar year, and numbering restarts at `000001` each year. Existing submitted-or-later cases are backfilled deterministically by `created_at,id` within each Africa/Lagos year, excluding discarded drafts. Dashboard wording distinguishes a draft as saved from a submitted request as received. The current notice is explicitly draft wording, not legally reviewed. Migration 024 is hosted, as confirmed by the linked migration ledger on 2026-10-23. Staff RLS and audited download authorization continue to exclude active drafts and discarded drafts. Case intake claims are not proof or verification. Case creation does not require a marketplace listing or existing parcel. Planning, approvals, construction, billing, public land discovery/GIS and AI endpoints remain later work until implemented and tested.

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

Migration 023's customer actions are POST server actions backed by owner-checked RPCs: draft submit, draft discard, and cancellation of submitted/assigned/in-review/needs-information cases. Cancelling an open assigned case ends its active assignment; the optional customer reason is recorded only in a private staff note. Discarded drafts and evidence are retained pending a retention decision.

Migration 024 adds a `case_consents` SELECT-only RLS resource: customers read their own records; staff read records only when scoped to the associated case; customers cannot directly write. The submit RPC records the `case_service_scope` consent. The customer UI derives a next-action label from workflow status in application code; it is not a database field.

Evidence uploads use `register_case_evidence` after the file passes Storage policy and server-side signature checks. A new document is a separate Version 1 record. A replacement must reference the current leaf of a same-case, same-type chain; the RPC locks the case row, and migration 025 adds a unique successor index so concurrent or stale replacements cannot fork a chain. Prior versions remain immutable. Upload activity is recorded as `document_uploaded`, not `status_change`. `customer_respond_to_case` keeps the fixed safe transition and actual response as separate, ordered events. Customer/staff timeline views render the event kind rather than treating every `to_status` as a milestone. Migration 025 is merged and hosted; the 026 correction above supersedes its upload-event and paired-response writing.

There is no staff notification delivery mechanism in the current repository. The notification function is a placeholder, and draft uploads do not enqueue or send staff notifications.

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
