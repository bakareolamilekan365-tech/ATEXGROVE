# Atexgrove — Authentication, Authorization & Security

## Security boundary and status

This document defines the security model for the modular-monolith prototype and its planned extensions. It is not a claim that every control below is already implemented. The current repository is the implementation source of truth; controls labelled **Future** or **Planned** require later implementation and operational validation.

The prototype uses Supabase Auth, PostgreSQL Row Level Security (RLS) and server-side application checks as the foundation. Sensitive operations must not rely on a client-side role check or a hidden UI control.

## Authentication

### Case consent and customer claims

Migration 024 records acceptance of the versioned `case_service_scope` notice in `case_consents` only from the owner-checked submit RPC. Authenticated clients have SELECT only; RLS allows the customer who accepted and staff with existing case-scoped access; anon has no grant and direct writes are revoked. The case number sequence is private and has no Data API grants. Intent, relationship-to-land, representation and authority-confirmation values are customer claims, not proof of ownership, identity, authority or government status; staff UI must preserve that label. Legacy rows remain null rather than receiving inferred claims. The service-scope notice is draft wording and not legally reviewed.

### Current prototype

- Supabase Auth provides the identity provider.
- The current user journey includes email/password sign-up and sign-in, with server-side user lookup through the Supabase SSR client.
- Session cookies and refresh handling are mediated by the application’s Supabase server/middleware integration where present.
- `main` implements a generic forgot-password response, PKCE callback exchange, hardened same-app redirect validation and an authenticated password-update page. Focused code tests exist; hosted redirect settings and real recovery email/link behavior are not yet verified end to end.

### Required flow model

The authentication boundary must account for:

- sign-up, login and logout
- session persistence and refresh
- password reset and account recovery
- session expiration and explicit revocation
- safe redirect and callback handling

Local sign-out is **Implemented on the current PR branch** through a POST action; CI verification is pending and it is not hosted functionality. Administrative session revocation remains **Planned**. Password recovery is **Implemented in code / operational verification pending** until hosted redirect settings, email delivery, expired/invalid links and end-to-end recovery are tested.

### Current implementation and security evidence

See [STATUS.md](STATUS.md) for the single current record of hosted migrations, Storage policies, CI/database-test evidence, accepted advisor items and operational verification gaps.

### Future authentication hardening

Multi-factor authentication (MFA), suspicious-login detection, device/session visibility, recovery codes and stronger account recovery are future security work. Recovery must not become an alternative path around normal authorization.

## Authorization model

Authorization is a contextual decision, not one global role check. The following concepts remain separate:

| Concept | Meaning | Security consequence |
| --- | --- | --- |
| Identity | The authenticated Supabase user | Establishes who is making a request; it does not grant access to every record. |
| Platform/user role | Broad relationship to Atexgrove, such as buyer, landowner, developer, professional or admin | A useful product classification, not a complete permission policy. |
| Professional discipline | Surveying, architecture, planning, construction, or another field | Describes expertise; it is not an administrative permission. |
| Organization membership/type | A user’s relationship to an organization and the kind of organization | Scopes organization resources and responsibilities. |
| Project membership/role | A person’s responsibility on a particular project | Scopes project resources and actions. |
| Permission | A specific allowed action, such as review, manage or export, within a scope | Must be granted deliberately and evaluated server-side. |
| Jurisdiction/scope | Country, region, planning area, organization, project or other boundary | Prevents a valid permission in one context becoming global access. |
| Subscription | Future commercial plan attached to an account or organization | Commercial state only; not an authorization grant. |
| Entitlement | A future product capability made available by a plan or policy | Must still be checked against identity, membership, permission and scope. |

**ROLE ≠ SUBSCRIPTION ≠ ENTITLEMENT.** A profession must not become a technical role for every profession, and a subscription must never bypass authorization.

The long-term decision should consider ownership, organization membership, project membership, administrative permissions, jurisdiction, least privilege and the sensitivity of the target object.

## Rules

- Users may edit only records they own or are explicitly permitted to manage.
- Organization members may access organization data according to organization membership and permission scope.
- Project members may access project resources according to project membership and project role.
- Administrative access is permission- and scope-based, not an unrestricted “God Admin” flag.
- Server-side authorization and database RLS are mandatory security boundaries; frontend visibility is only a convenience.
- Object-level checks must occur for every read, download, mutation and export. Do not trust an object identifier supplied by the browser.
- Service-role credentials remain server-side only. Never commit secrets to git or expose them to the browser.
- Private documents are never exposed through guessable or unrestricted public URLs.

## Administrative security

Atexgrove must support separated administrative responsibilities with least privilege. Conceptual examples include:

| Administrative responsibility | Example scope |
| --- | --- |
| Super Admin | Exceptional platform configuration and controlled emergency actions |
| Operations Admin | Operational workflows and approved records |
| Verification Admin | Assignment and review of verification work |
| Compliance Admin | Policy, retention and compliance investigations |
| Finance/Billing Admin | Future commercial records and payment operations |
| Support Admin | User-support actions without unrestricted data access |

These names are examples, not a final role catalogue. Each responsibility needs explicit permissions, resource/jurisdiction scope and, where appropriate, separation between request, review and approval. Sensitive operations should require an auditable actor, target, scope, timestamp, reason/result and relevant metadata. Controls should prevent privilege escalation, self-approval, cross-organization access and accidental use of broad service credentials.

## Row-level and object-level authorization

Supabase RLS should enforce the database side of authorization using authenticated identity, ownership, organization membership, project membership and relevant scope. Server actions/API routes must perform the same decision before invoking privileged operations. Policies should be designed to prevent:

- broken object-level authorization (BOLA) and insecure direct object references (IDOR)
- access through an alternate endpoint, export or download path
- privilege escalation by changing a role, organization ID or project ID in a request
- leakage through list queries, counts, search results or error messages

RLS policies and server checks should be tested together. A client can be modified by an attacker, so disabled buttons, route guards and hidden fields are not security controls.

## Document and storage security boundary

Documents follow the lifecycle specified in [08-DOCUMENTS-SPEC.md](08-DOCUMENTS-SPEC.md): upload → validate → security check → private storage → metadata → version → access control → review → verification status → audit → retention/deletion.

Storage must use private buckets/paths by default. During Phase 2, retrieval requires authorization against the related verification case, customer relationship, assignment or scoped administrative permission, followed by a short-lived signed or otherwise controlled response. Later land, project and organization scopes may extend this model. URLs must not be guessable, reusable without authorization, or treated as proof of legal validity. Metadata, version lineage and access/review events should be auditable.

## Verification trust and authority

Verification is a structured trust system, not one universal boolean or badge. Future verification types may include:

- identity verification
- organization verification
- professional verification
- land/document verification
- ownership/title verification
- survey-related verification
- planning-related verification

Each record should be able to identify its status, evidence, reviewer, source, submission/review dates, expiry and confidence. The authority hierarchy is:

```text
user-submitted information
→ automated checks
→ Atexgrove internal review
→ professional review
→ authoritative third-party confirmation
→ official/statutory confirmation
```

Atexgrove is a coordination and trust layer, not a government registry or statutory authority. Internal review must never be presented as government certification. A GIS polygon is a visual/spatial representation unless supported by survey, authoritative cadastral or official/legal records.

## Threat model

The design should anticipate at least:

- account takeover, credential stuffing and session/reset abuse
- BOLA/IDOR and privilege escalation
- malicious uploads, forged documents and document tampering
- GIS or provenance/data manipulation
- AI prompt injection and instructions hidden in uploaded content
- malicious or untrusted user-provided data
- administrator compromise and insider misuse
- dependency, build and CI/CD supply-chain attacks
- cloud/storage misconfiguration and secret exposure
- DDoS, scraping, abusive automation and rate-limit bypass

Threat treatment should be proportional to the prototype while preserving extension points for production controls.

## Security controls

- Validate input, file type, size, encoding and business state at the boundary; encode output where appropriate.
- Enforce ownership, membership, permission and scope checks on the server and in RLS.
- Use secure session/cookie settings, safe redirects, expiration and revocation concepts.
- Keep documents private and use authorized retrieval; normalize filenames and avoid path traversal.
- Apply rate limiting and abuse controls to authentication, uploads, search and expensive operations.
- Record important mutations, verification decisions, document access/review and administrative actions in audit logs.
- Store secrets in managed configuration, not source control or client bundles.
- Maintain dependency hygiene, secure headers/configuration where appropriate, monitoring and alerting.
- Plan backups, restore testing and disaster recovery as future operational concerns.

Retries must be bounded and use backoff where appropriate. Provider outages should fail gracefully. Financial operations must never be blindly retried; idempotency keys or equivalent protection are required before future payment flows.

## Incident response guidance

The future operational process is:

```text
detect → investigate → contain → remediate → recover
→ rotate credentials/patch → review → add regression protection
```

This is architectural guidance, not a claim that a complete incident-response service already exists. Incidents involving credentials, document exposure, verification decisions or administrative abuse require preservation of relevant audit evidence and explicit ownership of the response.

## AI security and governance

AI document or data analysis is **Future** and should run through an isolated provider adapter/background job. AI must not process real controlled-pilot documents; the initial pilot uses synthetic or properly redacted evidence. Uploaded documents, extracted text and user prompts are untrusted input. AI must:

- distinguish facts from estimates and communicate uncertainty
- avoid inventing missing information
- treat prompt injection and malicious document instructions as security risks
- remain advisory rather than an official, legal or professional authority
- defer consequential conclusions to qualified professionals or official authorities
- require appropriate human review before a decision changes verification, ownership, safety or compliance state

## Privacy and regulatory awareness

Security design should minimize personal data, restrict access, preserve auditability and support deliberate retention/deletion. Future compliance work must consider applicable Nigerian data-protection requirements, third-party processors, international transfers where relevant, consumer protection, land/planning/building administration, professional regulation and payment regulation. This document is architectural guidance, not legal advice; legal and domain-professional review remains necessary.

## Planned vendor and processor controls

These controls are **Planned**, not implemented. Maintain a register of third-party data processors/providers and their approval state, and document the specific data each is permitted to receive. Do not grant a provider broader access merely because it supplies one service. See [X-42](BACKLOG.md#x-42), [X-47](BACKLOG.md#x-47), [V-40](BACKLOG.md#v-40) and [V-41](BACKLOG.md#v-41). Any new application table must use explicit grants: authenticated SELECT only, no `anon` grant, and only the narrowly required server/service permissions.
