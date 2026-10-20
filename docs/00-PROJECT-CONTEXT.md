# Atexgrove — Project Context

## Product
Atexgrove

## Positioning
> The trusted digital ecosystem for land development in Africa.

## Prototype purpose
This repository is the first serious working prototype of Atexgrove. It must demonstrate a coherent end-to-end land-development workflow rather than a collection of disconnected mock screens.

Atexgrove is not simply a real-estate listing platform. Its long-term purpose is to help people and organizations move through a trustworthy land-development ecosystem:

```text
LAND → VERIFICATION → PLANNING → DESIGN → APPROVAL → CONSTRUCTION → PROPERTY → URBAN INTELLIGENCE
```

The current prototype proves only the beginning of this journey. The later stages are architectural direction, not claims about functionality already implemented in this repository.

## Accepted controlled-pilot journey

The first commercial slice is a controlled land-verification and development-feasibility service for Abuja/FCT. The verification-first order is accepted in `DECISIONS.md`: the case/evidence workflow and limited report come before public land discovery and GIS. Open questions refine staffing, named reviewers, report signatories/template, real-document policy, data licences and operational ownership; they do not reopen the delivery order.

1. User registers and selects a role.
2. User signs in and sees a role-aware dashboard.
3. User opens a land-verification and development-feasibility case, without needing an existing listing or marketplace parcel.
4. User records the Abuja/FCT site and submits synthetic or properly redacted private supporting evidence during the initial pilot.
5. Authorized staff assign, review, and hand over the case while preserving evidence sources, notes, status history, and audit events.
6. Qualified review produces a Land & Development Report that clearly separates supplied information, professional checks, authoritative confirmation, and unresolved matters.
7. A limited contextual map may locate the site within the case, but it must not imply cadastral, survey, title, legal, planning or statutory authority.
8. Land discovery, project workspaces, professionals, and broader development features follow after this controlled service is proven.

## Prototype scope
### Must work
- Authentication
- Role-aware onboarding
- Role-aware dashboard
- Verification case request, assignment, handover and status workflow
- Private document submission, controlled retrieval and evidence lineage
- Reviewer notes, source/authority labels and audit trail
- Deterministic development-feasibility inputs and report output
- Site location within a case, with honest GIS authority labels
- Admin/reviewer management limited to granted scope
- Database/API integration

The list above describes the target first commercial slice, not the current implementation; see [STATUS.md](STATUS.md) for the single current implementation, deployment, CI-evidence and verification-gap record.

### Architect but do not fake
- Planning intelligence
- Approval management
- Construction management
- Tendering
- Procurement
- Property management
- Finance integrations
- Education
- Professional networking
- Advanced AI
- Urban intelligence
- Multi-country expansion
- Offline construction workflows
- Public land discovery/marketplace behavior until the controlled case workflow is proven
- Full project/professional collaboration beyond what the first report service requires

If a feature is not implemented, label it as planned/pending. Never create controls that imply functionality that does not exist.

## Product principles

### Trust and provenance
Important land, GIS, document, professional and verification information should eventually retain where it came from, who supplied it, when it was collected or last updated, who reviewed it, the relevant jurisdiction, confidence, and verification state. A record presented by Atexgrove must not silently appear more authoritative than its source.

### Distinct concepts
Platform/user role, professional discipline, organization type, project role, permissions, and subscription/entitlement are separate concepts. A profession is not a permission, an organization membership is not a platform administrator role, and a subscription is not an authorization grant. The prototype may use simpler fields, but the long-term model must not collapse these concepts into one technical role per profession.

### Authority boundaries
Atexgrove must distinguish user-submitted information, automated checks, internal review, professional review, authoritative third-party confirmation and official/statutory confirmation. Internal review is not government certification. A GIS polygon is a visual/spatial representation unless backed by survey or authoritative cadastral records.

### Professional involvement and jurisdiction
Land development involves qualified professionals and jurisdiction-specific rules. The product should make professional review and jurisdiction visible where relevant, while avoiding legal, planning, surveying, investment or regulatory claims that the product cannot substantiate.

### Security and privacy
Documents and personal data are sensitive. The long-term design requires private storage, controlled access, auditability, retention/deletion rules and awareness of Nigerian data protection/privacy obligations, third-party processors, international transfers and sector-specific regulation. This documentation is architectural guidance, not legal advice.

### Planned versus implemented
The repository contains a modular prototype, placeholder migrations and future-facing domain documentation. Current UI and database behavior are the implementation source of truth. Planned, reserved and future architecture must be labelled as such and must not be represented as working functionality.

## Initial geography
Nigeria, with Abuja as the primary demonstration geography. The architecture must remain jurisdiction-aware so Lagos and other African markets can be added later.

## Data rule
All demo/synthetic data must be explicitly labelled as DEMO DATA / NOT OFFICIAL. The application must never imply that fictional records are government-verified or authoritative.

## Product principle
The prototype should prove the beginning of the wider land-development chain while preserving trust, provenance, authority boundaries, jurisdiction awareness and security/privacy as first-class architectural concerns.
