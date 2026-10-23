# Atexgrove — Database Schema

## Database

PostgreSQL with PostGIS.

## Schema status and implementation boundary

This document describes the current prototype's domain contract and the reserved shape of the future architecture; it is not a claim that every table listed below exists in the live database. Hosted migration history is `001`-`023` (023 applied after PR #26 merged, per owner confirmation). Migration 024 is implemented on PR #27 and is not hosted; the annual-numbering follow-up is covered by the current PR checks, not by the earlier CI runs for the preceding implementation.

## Conventions

- UUID primary keys
- `created_at`, `updated_at` on mutable entities
- `created_by` / `updated_by` where appropriate
- Foreign keys with explicit delete behavior
- Check constraints for controlled statuses
- Timestamps stored consistently in UTC
- Geometry columns use an explicitly documented spatial reference system

## Current live application tables

The current hosted application schema includes the foundation tables plus `staff_members`, `verification_cases`, `case_assignments`, `case_status_events` and Slice 2 `case_evidence`. Hosted migration history is at `023` (applied after PR #26 merged, per owner confirmation). The `case_consents` table described below is introduced by 024 and is not hosted.

### profiles

- id
- user_id
- full_name
- phone
- avatar_url
- account_type
- location_text
- bio
- created_at
- updated_at

### organizations

- id
- name
- organization_type
- registration_number
- description
- location_text
- verification_status
- created_at
- updated_at

### organization_members

- organization_id
- user_id
- role
- created_at

`organization_members.role` is an organization-scoped relationship, not a platform role or a profession. Future permissions should be evaluated from the user’s ownership, organization membership, project membership, administrative permissions and scope, with least privilege and RLS rather than one global role check.

### audit_logs

- id
- actor_user_id
- action
- entity_type
- entity_id
- metadata jsonb
- created_at

Audit records are required for important mutations, verification decisions, document access/review, administrative actions and permission-sensitive changes. They should preserve actor, action, target, scope, time and relevant metadata without turning the audit log into an unbounded dump of sensitive document contents.

## Phase 2/3 case-first schema

The first commercial workflow starts with a verification case, not a marketplace listing. A case may be created from site/request details before any `land_parcels` record exists. Any later parcel/listing link must be optional and follow-on.

The Slice 1 tables below are defined by hosted migration `018`; realistic hosted-session testing remains an operational gate. Slice 2 evidence is deployed through migration `019`. Migration `021` is hosted (applied 2026-10-21); migration `022` is hosted (applied 2026-10-23); migration `023` is hosted per owner confirmation. Migration `024` is under follow-up verification on PR #27 and is not hosted. Evidence review, report and feasibility tables remain **TARGET SCHEMA / PLANNED**.

### staff_members (Slice 1 repository implementation)

- user_id (primary key, linked to Supabase Auth)
- department (`Verification`, `Feasibility` or `Operations`)
- is_lead
- active
- created_at / updated_at

Slice 1 permits one active lead per department. Staff rows are provisioned only through a trusted database-operator/service-role path; account type does not create staff access. Customers cannot assign themselves staff or lead responsibility.

### verification_cases (Slice 1; idempotency added in migration 021)

- id
- customer_user_id
- created_by_user_id
- creation_channel (`customer` or authorized staff-assisted channel)
- jurisdiction
- department
- site description
- Abuja area/LGA
- `area_name` (migration 022; selected starter area or customer-entered unlisted area)
- `area_is_listed` (migration 022; whether the area came from the starter list)
- `address_line` (migration 022)
- customer notes nullable
- contact preference
- `contact_phone` nullable (migration 022; only with phone/WhatsApp preference and consent)
- `contact_phone_consent` (migration 022; defaults false)
- idempotency_key nullable UUID (migration `021`; unique per customer when non-null)
- `discarded_at` nullable timestamp (migration `023`; set only when the owner discards an unsubmitted draft; ordinary cancellation and submission leave it null)
- `customer_intent` nullable text (migration `024`; controlled customer claim; legacy rows remain null)
- `relationship_to_land` nullable text (migration `024`; controlled customer claim, not proof)
- `acting_for`, `principal_name`, `authority_confirmed` nullable legacy fields (migration `024`; new requests require a valid self/other/organization combination; for self, principal and authority confirmation are null)
- `case_number` nullable unique text (migration `024`; allocated only on submission; annual format `ATX-LV-<year>-<six digits>`, with serials restarting at `000001` each year)
- current_stage (fixed at `Request received` in Slice 1)
- workflow_status (`draft`, `submitted`, `assigned`, `in_review`, `needs_customer_info`, `closed`, `cancelled`)
- assigned_lead_user_id nullable
- is_demo_data (fixed true for the controlled synthetic pilot)
- created_at
- updated_at

Customer case creation uses a form-generated idempotency key. Replaying the same key and normalized request returns the existing case; materially different request data is rejected. Migration 024 replaces the 023 create signature with the existing ten fields plus `p_customer_intent`, `p_relationship_to_land`, `p_acting_for`, `p_principal_name`, and `p_authority_confirmed`. New claims are validated, but historical rows keep the columns null and the UI displays “Not recorded.” The RPC rejects the contradiction `customer_intent = representing_someone` with `acting_for = self`; representation for another person or an organisation requires principal name and confirmed authority. New requests remain private drafts with no initial timeline event. `submit_verification_case(uuid,text,boolean)` requires acceptance of the current notice version, records one `case_service_scope` consent, allocates an annual case number at submission, then emits the fixed submitted event; a replay writes no duplicate event, consent or number. Drafts have no case number. New submissions allocate `ATX-LV-<year>-<six digits>` using the Africa/Lagos calendar year from a private counter row keyed by year; an atomic `INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING` serializes concurrent allocations for that year, and each new year begins at `000001`. Existing submitted-or-later cases are backfilled deterministically by `created_at,id` within each Africa/Lagos year; owner-discarded drafts are excluded. Counter RLS is enabled, but no Data API role has table privileges or a policy, and allocation is only through the secured submit RPC. `case_consents` has RLS for the customer and scoped staff, authenticated SELECT only, no anon grant and no direct customer writes. Consent is written by the submit SECURITY DEFINER RPC. The scope notice is draft wording, not legally reviewed. Customer intake values are claims, not verification or proof of ownership. Discard, cancellation, evidence, and staff visibility rules from 023 remain unchanged. Migration 024 is implemented on this branch; follow-up verification is tracked in PR #27 checks. It is not hosted.

The `case_consents` table records `id`, `verification_case_id`, `customer_user_id`, `consent_type` (currently only `case_service_scope`), `notice_version`, and `accepted_at`; `(verification_case_id, consent_type)` is unique. Direct writes are revoked; authenticated users receive SELECT only, RLS restricts rows to the owner or staff authorized for the case, and anon receives no grant.

The current case-form UX requires Address details to contain at least 10 characters (maximum 500) in application validation; the database minimum remains 3 for compatibility. This UI-only rule does not change the schema.

### case_assignments (Slice 1 repository implementation)

- id
- verification_case_id
- assignee_user_id
- assigned_by_user_id
- status (`active`, `completed`, `cancelled`)
- created_at

A human department lead assigns manually in Slice 1. Acceptance/decline, capacity reasons and handover history remain Slice 3 work. A deactivated assignee cannot change case status, but lead-driven reassignment is not yet implemented; affected cases require controlled operator handling until Slice 3. Automation must not silently assign or approve.

### case_evidence (Slice 2 implementation — migration 019 hosted)

- id
- verification_case_id
- uploaded_by_user_id
- evidence_type (`title_deed_copy`, `survey_plan_copy`, `receipt`, `seller_id`, `other`)
- description
- source (fixed to `customer_supplied` in Slice 2)
- storage_path (private case/evidence/random object path)
- original_filename, MIME type and size
- version and nullable `supersedes_evidence_id`
- review_state (fixed to `received_unreviewed` in Slice 2)
- is_demo_data (fixed true for the controlled pilot)
- created_at

Evidence rows and objects are immutable to authenticated clients. Replacements create a new row and retain predecessor lineage. Customers can insert objects only under an owned, upload-eligible case; case-scoped staff and the customer can read metadata according to RLS, but authenticated users have no direct object-read policy. Staff retrieval must first pass the audited authorization RPC, after which a server-only service-role client creates a 60-second attachment URL. Customers cannot retrieve their own uploaded files in this slice. Registration writes the metadata row, customer-visible timeline event and audit row in one transaction. The 10-file limit counts registered evidence rows; an uploaded object whose registration fails is removed by the server action, but an object uploaded without completing registration is not counted, which is a known free-plan limitation. A case-evidence record means **received from customer — not authenticated**; it does not turn receipt into review, verification or official confirmation.

### case_evidence_reviews or case_findings (Planned)

- id
- verification_case_id
- case_evidence_id nullable
- reviewer_user_id
- review_state
- authority_level
- result
- notes
- limitations
- reviewed_at

Source, review state and authority level are separate. Authority levels must preserve user-submitted, automated check, Atexgrove review, professional review, authoritative-third-party confirmation and official/statutory confirmation.

### case_status_events (Slice 1 repository implementation)

- id
- verification_case_id
- actor_user_id
- from_stage/status nullable
- to_stage/status
- reason
- customer_visible
- event_kind (`status_change`, `staff_note`, `customer_message`, `information_requested`, `customer_response`; migration `021`)
- created_at

Status history is append-only for application clients: `anon` has no table access and `authenticated` receives no insert, update or delete privilege. The privileged `service_role`/database-operator boundary retains maintenance capability and must be tightly controlled and audited. Customers can read only events marked customer-visible; customer routes also filter the case owner explicitly so dual customer/staff accounts do not mix workspaces. Migration `020` is hosted and makes every assignee-driven transition write a fixed customer-safe status event, stores the required internal staff note as a separate hidden event, and creates a separate visible customer-message event only when staff deliberately supplies one. Migration `021` is hosted (applied 2026-10-21), adds `event_kind`, classifies historical events, and labels a customer reply as `customer_response` with a fixed customer-safe status line. Migration 022 is hosted (applied 2026-10-23); it recreates `assign_verification_case(uuid, uuid, text)` to write the fixed customer-visible line “A reviewer has been assigned to your case.” as `status_change` plus one private lead note as `staff_note`; no free-form assignment note is shown to customers. Migration 023 adds the draft-to-submitted and customer-cancellation events; staff-scoped reads exclude drafts and cases marked `discarded_at`. Migration 023 is hosted per owner confirmation. Migration 024 changes submission to require a versioned scope consent and allocates an annual case number; current-revision verification is reported by the checks attached to PR #27 (older CI evidence covered the previous implementation only). It is not hosted.

### feasibility_scenarios (Phase 3 target)

- id
- verification_case_id
- project_id nullable for later follow-on use
- name
- deterministic inputs and outputs
- assumptions
- calculation_version
- currency
- created_at / updated_at

The Phase 3 relationship is case-first. A later project link may be supported, but a project must not be required to calculate or explain the controlled pilot scenario.

### reports (Planned — Phase 3)

- id
- verification_case_id
- status
- version
- prepared_by_user_id
- delivered_at nullable
- limitations
- unresolved_matters
- exact evidence/version lineage used
- created_at / updated_at

### report_reviews (Planned — Phase 3)

- id
- report_id
- reviewer_user_id
- discipline
- decision
- comments
- reviewed_at

Consequential conclusions require a genuinely separate discipline-appropriate review. A review row must not imply official/statutory confirmation unless that distinct authority and source evidence actually exist.

## Later-phase domain tables (Planned/Reserved)

The remaining table concepts support Phase 4 GIS and Phase 5 projects/professionals or the longer-term ecosystem. They are not prerequisites for creating a Phase 2 verification case and are not implemented merely because placeholder migrations exist.

### professionals

- id
- profile_id
- discipline
- experience_years
- company_id nullable
- services
- areas_served
- verification_status
- portfolio_summary
- created_at
- updated_at

### land_parcels

- id
- reference_code
- title
- jurisdiction_id
- area_sqm
- land_use
- zoning
- price
- currency
- location_text
- latitude/longitude only when useful for display; geometry remains authoritative for GIS
- geometry
- access_description
- infrastructure_summary
- development_notes
- data_source
- data_as_of
- verification_status
- is_demo_data
- created_at
- updated_at

### land_listings

- id
- parcel_id
- owner_profile_id nullable
- listing_status
- asking_price
- currency
- description
- created_at
- updated_at

### land_documents

- id
- parcel_id
- document_type
- storage_path
- file_name
- version
- uploaded_by
- verification_status
- uploaded_at

The future document model must also account for validation/security-check results, private storage, controlled access, retention/deletion, audit history and version lineage. Storage paths must not become public URLs for sensitive documents.

### land_verifications

- id
- parcel_id
- status
- submitted_by
- assigned_reviewer nullable
- notes
- submitted_at
- reviewed_at nullable
- expires_at nullable

Verification is a structured trust record. Future representations should distinguish verification type (identity, organization, professional, land/document, survey-related, title/ownership or planning-related), status, evidence, reviewer, source, submitted/reviewed dates, expiry and confidence. The authority of a record must be explicit: user-submitted, automated, Atexgrove internal, professional, authoritative third-party or official/statutory.

### land_verification_items

- id
- verification_id
- category
- result
- notes
- evidence_document_id nullable

Evidence items should be traceable to their source and review event. A spatial polygon remains a visual/spatial representation unless backed by survey, authoritative cadastral or official/legal records.

### properties

- id
- parcel_id nullable
- property_type
- title
- description
- geometry nullable
- address_text
- price nullable
- currency nullable
- verification_status
- is_demo_data
- created_at
- updated_at

### projects

- id
- name
- project_type
- status
- parcel_id nullable
- location_text
- site_geometry nullable
- land_area_sqm nullable
- description
- owner_id
- organization_id nullable
- created_at
- updated_at

### project_members

- project_id
- user_id
- role
- invited_by
- created_at

### project_documents

- id
- project_id
- document_type
- storage_path
- file_name
- version
- status
- uploaded_by
- created_at

### professional_services

- id
- professional_id
- service_name
- description
- active

### project_professionals

- project_id
- professional_id
- role_on_project
- status
- added_by
- created_at

### notifications

- id
- user_id
- type
- title
- body
- read_at nullable
- created_at

## Jurisdiction model

Reserve these tables from the start:

- countries
- regions
- local_authorities
- planning_jurisdictions
- planning_schemes

The prototype can seed Abuja/FCT data without encoding Abuja-specific rules into application-wide business logic.

## Security

Use row-level security policies on every protected application table. Phase 2 policies must treat the verification case as the primary resource scope and combine authenticated identity, customer relationship, assigned responsibility and explicit administrative permission. Private evidence metadata and storage paths must respect the related case authorization. Later land/project policies extend this model rather than becoming prerequisites for it.

## Future authorization concepts (reserved, not new tables in this task)

The long-term schema may need separate representations for:

- platform/user roles
- professional disciplines
- organization types and organization-scoped roles
- project roles and project membership
- permission grants and administrative scopes
- jurisdictional scope

These concepts must remain distinct. A professional discipline must not become a technical permission role, and a future subscription or entitlement must not grant authorization by itself. Multiple administrative responsibilities (for example operations, verification, compliance, finance/billing and support) should be modelled as scoped permissions with auditable actions rather than one unrestricted administrator flag.

## Provenance and source authority (reserved)

Important land, GIS, document and verification records should eventually be able to retain source, source type, supplied by, collection/import date, verification date, reviewer, last updated time, jurisdiction, confidence and verification state. Source/authority records should preserve the distinction between user-submitted data, automated checks, internal review, professional review, authoritative third-party confirmation and official/statutory confirmation. Atexgrove internal review must never be stored or presented as government certification.

## Future document controls (reserved)

Document metadata should support a lifecycle of upload → validation/security checks → private storage → metadata → versioning → controlled access → review → audit → retention/deletion. Exact retention and deletion rules remain jurisdiction- and policy-dependent. Public buckets and unscoped download URLs are not acceptable for sensitive documents.

## Future billing and background-job boundaries (reserved)

Payments and subscriptions are outside the current prototype. If added later, keep plans, subscriptions, entitlements, transactions, invoices, payment events, refunds, disputes, webhook verification and idempotency in a separate commercial domain. Role ≠ subscription ≠ entitlement.

Long-running work may eventually need durable job state for AI document analysis, large GIS processing, report generation, bulk imports, notifications and analytics. The job model should support queued/running/succeeded/failed/cancelled states, retries and idempotency without coupling the current prototype to a background-processing platform.

## Scalability and jurisdiction notes

Future schema work should plan for indexes, pagination-friendly queries, query optimization, connection management, caching, spatial indexes and viewport-based GIS loading while avoiding N+1 access patterns. Horizontal scaling is a later operational decision. Jurisdiction identifiers should remain explicit so Nigerian and future African markets do not inherit Abuja-specific rules accidentally. Privacy, retention, third-party processors and international transfers must be handled with appropriate domain and legal review; this documentation is not legal advice.
