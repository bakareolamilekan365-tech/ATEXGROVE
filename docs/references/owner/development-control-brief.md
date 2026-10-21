ATEX GROVE DEVELOPMENT CONTROL ACCELERATION SYSTEM

Complete Building Plan Application Intake, Document Readiness and Service Request Module

1. Project Overview

Develop a complete, professional, scalable web application module for ATEX GROVE Development Control Acceleration System using Next.js, React, TypeScript, and a suitable backend and database architecture.

ATEX GROVE is designed to help developers, property owners, organizations, architects, engineers, and other applicants prepare and coordinate building plan applications for development control authorities.

The first jurisdiction configuration should focus on Abuja, Federal Capital Territory, Nigeria, using the Abuja Municipal Area Council (AMAC) building plan processing and approval application form as a practical reference.

The system must remain configurable for other authorities and jurisdictions in the future.

The main objective is to make the application process easier by identifying what the client already has, what is missing, what requires correction, what is uncertain, and what services the client wants ATEX GROVE to arrange.

Do not build this as a simple online form. Build it as a complete application intake and document readiness management system.

2. Main Application Form

Create a structured digital version of the AMAC building plan processing and approval application form, using the printed fields in the supplied reference photographs.

Ignore handwritten entries in the photographs. Use the printed form structure as the reference, and distinguish confirmed form fields from proposed additions.

Include the following sections.

A. Applicant and Developer Information

* Applicant or developer’s full name.
* Individual, company, organization, or other applicant type.
* Organization name and authorized representative, where applicable.
* Phone number.
* Email address.
* Contact address.
* Preferred contact method.
* Representative’s contact details, where applicable.

B. Project and Plot Information

* Project name.
* Plot number.
* Cadastral zone.
* District.
* Street or location details, where applicable.
* Project site address.
* Development type.
* Proposed use of the building.
* Number of floors and building height.
* Plot size, where known.
* Project description.
* Relevant previous application or approval reference.
* Other project-specific information required by the applicable authority.

C. Application Type

Provide selectable application types:

* New submission.
* Resubmission.
* Revalidation.
* Other.

When the client selects resubmission, allow the system to retrieve the previous application, display its outstanding deficiencies, show previously submitted documents, accept revised versions, compare revisions, and preserve the full application history.

Revalidation must follow the applicable authority’s configured requirements. Do not assume all application types use identical checklists.

3. Document Readiness and Status Management

Every document, drawing, report, credential, and supporting item must have an individual readiness status.

Use the following statuses:

1. Available and ready for upload.
2. Available but requires correction or updating.
3. Not available.
4. Unsure whether the item is required.
5. Available but requires verification.
6. Uploaded and awaiting review.
7. Verified as complete for the current checklist.
8. Deficient or rejected during internal review.
9. Assistance requested.
10. Not applicable, with a recorded reason where appropriate.

Do not treat an uploaded document as automatically verified.

The system must distinguish between file receipt, completeness checks, professional verification, and official authority decisions.

Every checklist item should display:

* Document or requirement name.
* Description and purpose.
* Applicable or conditional status.
* Required, optional, or conditionally required designation.
* Current readiness status.
* Upload control.
* Version number and upload date.
* Responsible reviewer or professional, where applicable.
* Verification status.
* Deficiency notes.
* Evidence or source of the requirement.
* Assistance request option.
* Review history.

4. Document and Supporting Evidence Categories

Create configurable document categories, including the following.

A. Land and Title Documents

Examples include:

* Letter of allocation.
* Certificate of Occupancy.
* Title deed plan.
* Survey plan.
* Deed of assignment.
* Title regularization records.
* Other applicable ownership, allocation, or title evidence.

Allow the client to upload available documents or request assistance with obtaining, locating, reviewing, or verifying relevant records.

ATEX GROVE must not represent itself as a land registry or claim to issue title documents.

B. Architectural Drawings

Examples include:

* Site plan.
* Architectural floor plans.
* Elevations.
* Sections.
* Site layout.
* Other drawings required for the project.

If missing or incomplete, the client must be able to request architectural design, drawing preparation, review, or revision through an appropriately qualified professional.

C. Engineering Drawings and Calculations

Examples include:

* Structural drawings.
* Structural calculations.
* Electrical drawings.
* Mechanical drawings.
* Other engineering plans, schedules, and calculations required by the project.

Allow clients to request preparation, coordination, correction, review, and applicable professional sign-off through competent and appropriately registered professionals.

D. Survey and Site Investigation

Examples include:

* Topographic survey.
* Contoured site plan.
* Plot location and boundary survey.
* Site inspection.
* Site assessment.
* Geotechnical investigation.
* Soil investigation report.

Allow clients to request these services when required and available.

E. Specialist Reports

Examples include:

* Environmental assessments or reports.
* Fire safety reports or supporting documents.
* Other technical or specialist reports required by the applicable authority or project.

Requirements must be determined by project applicability and the relevant authority’s rules.

F. Professional Credentials and Administrative Records

Examples include:

* Applicable professional registration and practice documents.
* Previous approval documents.
* Previous application references.
* Submission receipts.
* Technical reports.
* Required supporting declarations and forms.

Allow authorized verification and coordination where appropriate.

Do not assume every item is mandatory for every project. The system must determine applicability using configured jurisdiction rules, project characteristics, and submission type.

5. Missing-Document Assistance System

This is one of the most important features.

When a client marks a document or requirement as missing, incomplete, uncertain, or requiring verification, provide a clear option:

“Request ATEX GROVE Assistance.”

This option must be available at the individual checklist-item level and within a consolidated assistance dashboard.

The client should not need to leave the application form to request assistance.

When the client requests help, capture:

* The document or service needed.
* Related project and application reference.
* Plot and location information, where relevant.
* Description of the problem.
* Existing supporting documents.
* Preferred service timeline.
* Urgency.
* Preferred contact method.
* Additional notes.
* Client consent for the requested coordination.
* Relevant privacy and information-sharing permissions.

Allow one assistance request to cover several related missing items when appropriate.

Examples of service requests include:

* Land and title document coordination.
* Survey plan and plot-location coordination.
* Topographic and contour survey coordination.
* Site inspection and assessment.
* Architectural design and drawings.
* Structural, electrical, and mechanical drawings.
* Engineering calculations.
* Geotechnical investigation.
* Environmental and fire-related reports, where applicable.
* Professional credential verification.
* Document digitization and organization.
* Drawing corrections.
* Resubmission preparation.
* Guidance on applicable application requirements.

The system must distinguish services ATEX GROVE provides directly from services requiring external providers, qualified professionals, or government authorities.

Do not promise that a missing official document will be obtained or that a professional will be available before the request is assessed.

6. Service Request Workflow

Implement the following workflow:

1. The client identifies a missing, incomplete, or uncertain requirement.
2. The client requests assistance.
3. ATEX GROVE receives the request in an internal service request dashboard.
4. The team reviews the scope, project details, applicability, feasibility, and any supporting information.
5. The team identifies whether the work is handled internally or requires a qualified external professional.
6. ATEX GROVE prepares a service scope and quotation.
7. The client reviews the proposed service, price, expected timeline, exclusions, and conditions.
8. The client explicitly accepts the quotation and authorizes the work.
9. The request moves to an approved-for-work status.
10. An authorized team member or suitable professional is assigned.
11. The client tracks progress and receives updates.
12. Completed documents or deliverables are uploaded to the appropriate checklist item.
13. The system updates readiness status and preserves the full history.

No paid work must begin before the client accepts the applicable quotation and terms.

A service request must not be treated as authorization to incur costs.

7. Quotation and Client Consent

Create a quotation management module.

Each quotation should contain:

* Unique quotation reference.
* Related client, project, and service request.
* Detailed scope of work.
* Deliverables.
* Service provider, where applicable.
* Professional fees.
* Third-party charges.
* Applicable taxes and additional costs.
* Total quoted price and currency.
* Estimated completion period.
* Dependencies and client responsibilities.
* Exclusions.
* Expiry date.
* Terms and conditions.
* Quotation status.
* Client acceptance record.
* Acceptance timestamp.
* Authorized client identity.
* Version history.

Quotation statuses should include:

* Draft.
* Under internal review.
* Sent to client.
* Accepted.
* Declined.
* Expired.
* Revised.
* Cancelled.
* Approved for work.

Require an explicit client action to accept a quotation. Do not preselect acceptance checkboxes or infer consent from uploading a document.

Record consent in an auditable manner. If a quotation changes materially, obtain renewed client acceptance.

Separate quotation acceptance from any separate privacy consent or authorization required to share information with external professionals.

8. Configurable Jurisdiction and Rules Engine

Build a rules engine that allows administrators to configure requirements for each authority.

Each requirement should support:

* Jurisdiction.
* Authority name.
* Application type.
* Development type.
* Proposed building use.
* Project size or scale.
* Height or number of floors.
* Relevant risk factors.
* Required document or report.
* Applicability conditions.
* Required, optional, conditional, or not applicable status.
* Official source reference.
* Source verification status.
* Effective date.
* Version number.
* Last reviewed date.
* Reviewer responsible for validation.
* Notes and exceptions.

Support versioned rules. Preserve the rules applied to each application so historical submissions remain auditable.

Do not automatically treat an unverified rule as an official requirement.

AMAC forms are practical reference material, not universal requirements for every Abuja/FCT authority or project.

9. Document Completeness and Gap Report

Generate a personalized Pre-Submission Gap Report for every application.

The report should show:

* All applicable requirements.
* Documents already uploaded.
* Documents awaiting review.
* Missing items.
* Items requiring correction.
* Items requiring verification.
* Items marked as uncertain.
* Assistance requests opened.
* Outstanding client actions.
* Outstanding professional tasks.
* Outstanding quotations and client approvals.
* Resubmission deficiencies.
* Next recommended actions.

Show overall readiness and completion percentages based on clearly defined applicable requirements.

Do not mark an application as submission-ready when critical requirements remain unresolved.

Use a clear internal status such as:

* Draft.
* Intake incomplete.
* Awaiting documents.
* Assistance requested.
* Under document review.
* Corrections required.
* Awaiting client approval.
* Preparing resubmission.
* Internally ready for submission.
* Submitted, pending official review.
* Official response received.
* Closed or withdrawn.

The system must clearly state that internal readiness is not official approval or a guarantee of compliance.

10. Resubmission and Revision Management

When a client selects resubmission:

* Retrieve the previous application and its history.
* Display outstanding deficiencies.
* Link each deficiency to the relevant document or drawing.
* Identify the responsible party.
* Record correction instructions and deadlines.
* Accept revised files without overwriting previous versions.
* Compare previous and revised versions.
* Record review findings and revision notes.
* Flag changes that affect other disciplines.
* Update dependent checklists when applicable.
* Generate an updated gap report.
* Assemble a proposed resubmission package.
* Preserve all prior application versions, evidence, and decisions.

Use change-impact tracking to identify possible conflicts between architectural, structural, electrical, mechanical, site, and specialist documents.

AI-assisted comparison must include confidence indicators and human review for uncertain or safety-critical findings.

11. Client Dashboard

Create a clear client dashboard showing:

* Active applications.
* Project details.
* Application type.
* Document readiness.
* Missing documents.
* Assistance requests.
* Quotation statuses.
* Outstanding approvals.
* Assigned service providers.
* Current service progress.
* Deficiencies and correction requests.
* Previous submissions.
* Recent activity.
* Notifications.
* Expected next actions.

Clients should understand exactly what remains outstanding and who needs to act.

12. Internal Administration Dashboard

Create role-based administrative screens for:

* Managing applications.
* Reviewing uploaded documents.
* Configuring jurisdiction rules.
* Managing document checklists.
* Reviewing assistance requests.
* Preparing and revising quotations.
* Recording client acceptance.
* Assigning qualified professionals.
* Tracking service progress.
* Managing deficiencies.
* Reviewing resubmissions.
* Managing client complaints and escalations.
* Monitoring audit logs and access history.

Support roles such as applicant, organization representative, intake officer, reviewer, service coordinator, professional provider, and administrator.

Limit each role to the information and actions required for its responsibilities.

13. Security, Privacy, and Audit Trail

Implement:

* Secure authentication.
* Role-based authorization.
* Organization and project-level access restrictions.
* Secure document storage.
* File type and size validation.
* Upload access controls.
* Encryption in transit and appropriate protection at rest.
* Versioned document records.
* Consent records.
* Activity and audit logs.
* Controlled external sharing.
* Retention and deletion policies.
* Secure error handling.
* Protection against unauthorized access and insecure file uploads.

Do not expose private application documents through public URLs.

Do not allow one client’s documents or project data to appear in another client’s account.

Use explicit authorization before sharing client information with external professionals.

14. Technical Architecture

Use Next.js, React, and TypeScript.

Design the system with modular components and a maintainable project structure.

Provide a suitable backend and relational database, such as PostgreSQL with Prisma or an equivalent typed database layer.

Separate:

* Application intake.
* Project and plot records.
* Jurisdiction configuration.
* Document requirements.
* Document uploads and versioning.
* Document reviews.
* Assistance requests.
* Quotations and consent.
* Professional assignments.
* Deficiency management.
* Resubmissions.
* Notifications.
* Audit records.

Define appropriate database relationships, validation schemas, API endpoints or server actions, permission checks, and error handling.

Use reusable form components and conditional fields.

Support mobile, tablet, and desktop layouts.

Keep business rules out of purely presentational components.

Use environment variables for secrets and provide an example environment configuration without real credentials.

Include database migrations, seed data for a clearly labelled demonstration configuration, and setup instructions.

Do not hardcode the assumption that all requirements apply to every project.

15. Implementation and Testing

Implement the system in stages.

Stage 1: Project setup, database schema, authentication, and application intake.

Stage 2: Configurable document requirements and readiness tracking.

Stage 3: Secure uploads, document reviews, and gap reports.

Stage 4: Assistance requests, service assignments, quotations, and consent.

Stage 5: Resubmission tracking, document versions, and deficiency management.

Stage 6: Client dashboard, administrative dashboard, notifications, and audit trail.

Stage 7: Automated tests, security review, accessibility checks, and deployment preparation.

Provide tests for:

* Conditional document applicability.
* Required-field validation.
* Document status transitions.
* Access restrictions.
* Assistance request creation.
* Quotation acceptance.
* Prevention of work authorization before consent.
* Quotation revision and renewed consent.
* Resubmission version preservation.
* Jurisdiction rule versioning.
* Gap report accuracy.

Do not claim a feature is complete unless it has been implemented and tested.

16. Non-Negotiable Business Rules

ATEX GROVE supports application preparation, document coordination, professional collaboration, and readiness checks.

It must never:

* Grant a development permit.
* Impersonate an authority or government officer.
* Falsify official documents or records.
* Guarantee application approval.
* Guarantee compliance.
* Present unverified requirements as official rules.
* Claim to issue land titles or statutory certificates.
* Replace qualified professionals or statutory assessments.
* Start paid work without the required client authorization.

Keep the platform transparent about service scope, costs, responsibilities, and the difference between internal review and official decisions.

17. Expected Deliverables

Produce:

1. A complete, maintainable Next.js and TypeScript codebase.
2. The application intake interface.
3. Configurable document requirement management.
4. Document readiness tracking.
5. Assistance request management.
6. Quotation and client consent workflows.
7. Resubmission and deficiency tracking.
8. Client and administrative dashboards.
9. Database schema and migrations.
10. Secure upload architecture.
11. Automated tests.
12. Environment configuration example.
13. README with setup, development, testing, and deployment instructions.
14. A list of implemented features, incomplete features, and production dependencies.

Begin by examining any supplied existing ATEX GROVE codebase. Preserve its established architecture, components, design system, and naming conventions where practical. If no codebase is supplied, create a clean standalone starter project.

Before implementation, identify any assumptions and significant architectural decisions. Then build the first working vertical slice, test it, and continue in manageable stages.

Keep the work focused on this application intake module. Design it to connect to future ATEX GROVE modules without prematurely implementing unrelated systems.