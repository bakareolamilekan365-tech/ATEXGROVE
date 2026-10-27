# Atexgrove — Document Management Specification

## Upload, submission and review are separate (026 merged, CI-verified and owner-confirmed hosted)

Staff transitions from `needs_customer_info` permit only `closed` or `cancelled`, never `in_review`. The customer's explicit reply is the only resumption path and atomically releases all pending evidence; closure/cancellation keep it private. Customers can upload only in `draft` or `needs_customer_info`, and must wait for a staff request after submission.

Hosted history was independently checked 2026-10-25 through 025. The owner subsequently applied 026 and confirms numeric history through 026; earlier dated statements that it was pending remain historical.

1. **Uploaded:** private object and metadata saved, with uploader, upload time, category, version, predecessor and creation audit.
2. **Pending customer submission:** `submitted_at` is NULL. Customer sees “Saved — not yet submitted to the review team”. The state persists across sessions. A pending replacement never removes staff access to an already-submitted predecessor.
3. **Submitted for staff review:** explicit Submit request or Submit response releases all pending versions atomically and records their IDs in the submission audit. Customer/staff document history says “Submitted for review — not authenticated”, shows upload/release dates and retains all versions.
4. **Professionally reviewed/authenticated:** separate future functionality. Upload, release, case review and closure confer no legal authentication.

Uploads are permitted only while drafting or preparing a requested response. During submitted/assigned/in-review states, staff must request information to open a preparation window. The November transport sends the binary from the authenticated browser directly to private Storage; the metadata-only server finalizer rechecks state and validates the stored signature before registration. Files uploaded before a concurrent staff status change but not registered use best-effort cleanup; registration rechecks under the case lock and never implicitly submits. Existing 10 MiB, PDF/JPEG/PNG and ten-total-version limits are unchanged. No customer delete/retention or download feature is introduced.

The main timeline omits upload events; document history supplies file activity. Old event/audit rows are retained, including unmatched legacy communication. Existing non-draft/non-discarded evidence is grandfathered as submitted at creation time for compatibility; the timestamp does not claim historical explicit consent.


## Scope and implementation boundary

Documents are sensitive assets connected to users, organizations, verification cases, later land parcels and projects. The Phase 2 primary resource scope is the verification case; a case and its evidence must not require an existing marketplace parcel. This specification defines the target controls without claiming that every lifecycle stage is implemented today.

**Current hosted state:** migrations `001`–`025` are recorded in the linked hosted ledger checked after controlled history normalization on 2026-10-25; migrations 024 and 025 have no recorded apply time in that ledger. Migration 026 is subsequently owner-confirmed hosted, with no claimed apply timestamp. Migration 023 permits draft evidence and adds owner submit/discard/cancel behavior. Evidence rules remain: private bucket, PDF/JPEG/PNG, signature checks, 10 MB per file, ten registered evidence rows per case, immutable version lineage and staff-only audited signed downloads. Staff-scoped RLS and download authorization exclude active drafts, discarded drafts and pending evidence. Discarded draft records and evidence remain retained pending a separate retention/deletion decision.

## Supported Slice 2 types

- PDF
- PNG/JPG
Slice 2 deliberately excludes SVG, HTML and Office formats. Additional formats require an explicit security and processing decision.

## Document lifecycle

Every important document should move through this conceptual lifecycle:

```text
UPLOAD
→ VALIDATE
→ SECURITY CHECK
→ PRIVATE STORAGE
→ METADATA RECORD
→ VERSION
→ ACCESS CONTROL
→ REVIEW
→ VERIFICATION STATUS
→ AUDIT
→ RETENTION/DELETION
```

The prototype may expose only a subset. Missing steps must be labelled as planned and must not be implied by a badge or button.

## Metadata

The document record should be capable of retaining:

| Field/concept | Purpose |
| --- | --- |
| Document ID | Stable identifier independent of a filename or storage URL. |
| Owner/entity | Verification case and customer relationship for Phase 2; later organization, land parcel or project scope where applicable. |
| Uploader | Authenticated actor that submitted the file. |
| Type | Controlled document type, such as title, survey, plan, identity or project record. |
| Filename and MIME type | Display and validation metadata; filenames are normalized before storage. |
| Size | Resource, quota and abuse-control checks. |
| Upload date / last updated | Lifecycle and provenance timestamps. |
| Status | Draft, Submitted, Under Review, Approved, Rejected or Archived. |
| Version | Human-readable version plus immutable version lineage. |
| Verification state | Structured trust state, not a claim of legal validity. |
| Reviewer / review timestamp | Who reviewed the record and when. |
| Source/provenance | Source, authority, supplied-by, collection/import date, jurisdiction, method and confidence where relevant. |
| Storage reference | Private bucket/path or object identifier; never a public secret-bearing URL. |

Metadata should not contain unnecessary copies of sensitive document content. Access and review events belong in the audit trail.

## Versioning

- Important evidence versions are immutable after submission.
- A revised upload creates a new version where appropriate; it does not silently replace historical evidence.
- Independent new documents each begin at Version 1. A replacement explicitly selects the latest version, must remain in the same case and document type, increments the version by one, and retains the predecessor, uploader, timestamp and reason.
- The merged/hosted migration 025 rejects stale predecessors and adds a database uniqueness guard so a predecessor can have only one successor. Existing evidence metadata is preserved; hosted data was checked for duplicate predecessor links and inconsistent case/type/version links before preparing the migration.
- Review and verification decisions must point to the version reviewed, not only to the logical document ID.
- Archived versions remain discoverable to authorized reviewers subject to retention policy.

## Security and private storage

- Use private buckets/storage paths by default.
- Authorize the related verification case, customer and assigned/scoped staff responsibility before every Phase 2 retrieval, download, preview or export. Later organization, land or project relationships may extend the decision.
- Return only short-lived signed or otherwise controlled access; do not expose guessable public document URLs.
- Validate MIME/type, size, extension and content expectations at upload. Normalize filenames and prevent path traversal or unsafe object names.
- Treat macros, embedded scripts, malformed files and polyglot files as malicious-file considerations.
- Malware scanning, content disarm/reconstruction and quarantine are **Future** integrations where risk requires them.
- Store service-role credentials only on the server and never in client bundles or committed environment files.
- Access, review, rejection, approval, version changes and deletion should be auditable without dumping full sensitive contents into logs.

Slice 2 uses `documents/cases/{case_id}/{evidence_id}/{random}.{ext}`. The original filename never becomes part of the object path. PDF, JPEG and PNG are allowlisted and each file is limited to 10 MiB. The browser checks the first bytes for UX, uploads directly with the customer session and `upsert: false`, then sends metadata only to the server. Before registration, the server checks authoritative Storage size/MIME and reads only bytes 0-7 from the private object to validate its signature. Each case is limited to 10 registered evidence rows. Customers may upload only to their own non-discarded `draft` or `needs_customer_info` case, but cannot retrieve their own uploaded files in this slice. Staff cannot read draft metadata or files. Neither leads nor assignees can read `storage.objects` directly: staff retrieval must use the server action, which calls the audited authorization RPC before a server-only service-role client creates a 60-second signed download URL. Files are served as attachments and never rendered inline.

The 10-file limit counts registered evidence rows. The application removes an uploaded object when registration fails, but a client that uploads an object without completing registration does not consume the evidence-row limit. This orphan-object gap is a known free-plan limitation and requires operational monitoring/cleanup rather than being represented as a stronger quota guarantee.

There is no antivirus or malware scanning on the free-plan Slice 2 path. Every file remains untrusted even when its MIME type is allowed. Real customer documents remain prohibited until the legal name, privacy notice, retention and operational-control questions are settled. Every row remains visibly labelled `DEMO DATA / NOT OFFICIAL` and “Received from customer — not authenticated.”

## Prototype document states

- **Draft** — uploaded or being prepared; not submitted for a decision.
- **Submitted** — explicitly submitted for review.
- **Under Review** — assigned review is in progress.
- **Approved** — approved within the stated Atexgrove workflow and scope.
- **Rejected** — review found a problem or insufficient evidence; reason should be recorded where appropriate.
- **Archived** — retained for history but not active in the current workflow.

Document status is not the same as legal validity, statutory registration, ownership, professional certification or government approval. Atexgrove internal approval must not be represented as official confirmation.

## Provenance and authority

Important verification documents should be able to record:

- source and source type
- authority or issuing body
- supplied by / uploader
- reviewer and review date
- collection/import date and last updated date
- jurisdiction
- verification method and state
- confidence or limitations where applicable

The authority hierarchy is:

```text
user-submitted information
→ automated checks
→ Atexgrove internal review
→ professional review
→ authoritative third-party confirmation
→ official/statutory confirmation
```

Storing a document does not make it legally authoritative. GIS or scanned boundary material is not automatically an authoritative cadastral boundary; the source and legal/official status must remain visible.

## Sensitive information

Document access follows minimum-necessary principles. The architecture should support scoped organization/project access, reviewer assignment, explicit download permission, retention/deletion decisions and auditability. Retention periods, deletion exceptions and legal holds are jurisdiction- and policy-dependent and require appropriate domain/legal input.

### Planned external-professional handling

This is **Planned**, not implemented. No external professional receives general case access. Each engagement is per assignment, limited to selected evidence, time-limited, revocable and audited at document-open/download level. A sharing package should contain only the evidence chosen for that assignment. Record any applicable professional agreement and confidentiality terms before access, and define handling/deletion of professional copies when the assignment ends. See [P-31](BACKLOG.md#p-31), [P-d](BACKLOG.md#p-d), [P-50](BACKLOG.md#p-50) and [X-51](BACKLOG.md#x-51).

## AI document analysis (Future)

AI extraction or analysis is not required for the current prototype and must not process real controlled-pilot documents. The initial pilot uses synthetic or properly redacted evidence. If AI is added later, it should run asynchronously through a background job and an `AIProvider` adapter. Uploaded files and extracted text are untrusted input. AI output is advisory, must include confidence/uncertainty, must not invent missing facts or impersonate legal/professional/official authority, and requires human or professional review before consequential status changes.

## Scalability and resilience (Future)

The document subsystem should leave room for object storage, large files and metadata queries without loading full documents into normal request paths. Plan for:

- pagination and indexes on owner/entity, status, version and timestamps
- asynchronous scanning, extraction, report generation and bulk processing
- bounded retries with backoff for provider/storage operations
- idempotent upload/job handling and safe recovery after timeouts
- graceful failure when a storage or analysis provider is unavailable
- avoiding N+1 metadata and permission queries

Long-running work should expose durable states such as queued, running, succeeded, failed and cancelled, with retry/error metadata, without forcing a background-processing platform into the current prototype.

## Current prototype boundary

Migration 024 is present in the linked hosted ledger. The app offers five evidence categories (title deed copy, survey plan copy, receipt, seller ID and other), one-line purposes, per-category supplied counts and an Add action that preselects the type. No category is mandatory for every case. Upload UI distinguishes a separate “New document” from a “Replacement version” and only offers the latest same-type version for replacement. Pending files are labelled “Saved — not yet submitted to the review team”; submitted files are labelled “Submitted for review — not authenticated”; the list does not authenticate, review or determine document sufficiency. Migration 025 is merged and hosted; its per-upload event behavior is superseded by 026 on this branch. See [STATUS.md](STATUS.md) for separate implementation, CI and hosted evidence.

Slice 2 still does not include document authentication, findings, reviewer decisions, staff uploads, full project/organization authorization, malware scanning, privileged-operator immutability, jurisdiction-specific retention/deletion, background processing or AI analysis. A received file is not “verified”, “approved” or “valid”. Hosted cross-user object isolation with realistic authenticated sessions remains a separate operational gate after approved deployment.

Application audit administrators are also constrained by case scope for case audits and by submitted evidence for file audits; the audit API cannot expose pending preparation. Raw audit records remain retained for trusted database operators.
