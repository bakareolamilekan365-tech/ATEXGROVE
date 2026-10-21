# How Atexgrove works

## The simple picture

People use Atexgrove through a web browser. The web application handles what they see and checks what they are trying to do. Supabase provides account management, the database, and private file storage.

```text
User → Atexgrove website → permission checks → database/private storage
```

## Accounts and identity

Supabase confirms who is signed in. Atexgrove then uses its own records to decide what that person is allowed to see or change.

Choosing an account type such as “professional” is only a user claim. It does not prove identity, professional registration, authority, or verification status.

## Information storage

The working prototype currently supports:

- user profiles;
- organizations;
- organization membership;
- audit records;
- customer verification cases and a staff work queue;
- private case evidence uploads and audited staff downloads;
- customer-safe case updates and replies when more information is requested.

Reports, projects, professional services, land discovery, and feasibility scenarios are still future work. The case workflow is a prototype and does not confirm land ownership, planning approval, or official status.

## Private files

The hosted system has private document storage connected to verification cases. Customers can add allowed evidence files to their own eligible cases; staff downloads go through an audited permission check. Customers cannot download their uploaded files yet. Files are treated as unverified customer submissions, not proof of ownership or official approval. The new case form also prevents a refresh or retry from creating a duplicate when it repeats the same request; reusing its key for different request details is rejected. These idempotency changes are merged and passed temporary CI, but migration 021 is not yet applied to hosted Supabase.

The pilot begins with synthetic or properly redacted evidence. Before real documents are accepted, Atexgrove needs approved terms and privacy information, explicit consent, minimum-necessary access, a retention/deletion process, an incident process and appropriate professional review of those rules.

Important evidence will use versions rather than silent replacement. If a customer supplies a clearer document, the new copy becomes the current version while the earlier copy and the review linked to it remain available to authorized reviewers until the applicable retention rule permits deletion.

## Testing and deployment

Connecting to hosted Supabase and applying reviewed migrations does not require Docker. Docker is used to create a temporary local Supabase system for database permission tests. GitHub Actions has run the migrations and automated allow/deny tests successfully through migration 021 in a temporary environment. The hosted database is still at migration 020, and separate hosted-user testing is still required.

## The controlled case journey

The intended pilot journey has six understandable stages: request received, documents in, document checks, site and map, development options, and report. The current prototype covers case intake, staff assignment/review, private evidence, and customer clarification; maps, feasibility and reports are not yet implemented.

A customer may start a case, or authorized staff may assist with recorded consent. A human lead controls assignment; automation may only recommend. Important conclusions require review by a suitably qualified second person, while government or statutory evidence remains a separate authority level.

## Maps

Maps are planned for locating and understanding a site. A map image or boundary is not automatically an official survey, title record, cadastral boundary, or planning confirmation. The product must always show the source, date, location, and authority level of map information.

## Feasibility calculations

Development-feasibility results will come from visible inputs and repeatable calculations. They must show assumptions and limitations. They are estimates, not guarantees of profit, approval, cost, or development rights.

## Why everything stays in one application for now

The first prototype is deliberately one organized application instead of many separate services. This keeps cost and complexity low. Separate services should only be introduced later when scale or team ownership provides a real reason.

