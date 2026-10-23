# How Atexgrove works

## The simple picture

People use Atexgrove through a web browser. The web application handles what they see and checks what they are trying to do. Supabase provides account management, the database, and private file storage.

```text
User → Atexgrove website → permission checks → database/private storage
```

## Accounts and identity

Supabase confirms who is signed in. Atexgrove then uses its own records to decide what that person is allowed to see or change.

Choosing an account type such as “professional” is only a user claim. It does not prove identity, professional registration, authority, or verification status.

One account can be both a customer and a staff member by design. These roles are stored separately, and the customer and staff areas show separate views. Signing out is available in both workspaces. There is no idle sign-out timer today; the session lasts until its Supabase cookie expires or the person signs out.

## Information storage

The working prototype currently supports:

- user profiles;
- organizations;
- organization membership;
- audit records;
- customer verification cases and a staff work queue;
- private case evidence uploads and audited staff downloads;
- customer-safe case updates and replies when more information is requested.

Reports, projects, professional services, land discovery, and feasibility scenarios are still future work. The case workflow is a prototype and does not confirm land ownership, planning approval, or official status. Migration 021 is hosted (applied 2026-10-21), migration 022 is hosted (applied 2026-10-23), and 023 was applied after PR #26 merged, per owner confirmation. Migration 024 is implemented on PR #27 and is not hosted; earlier CI covered its previous revision, and current follow-up checks are attached to that PR. See docs/STATUS.md for current status.

## Private files

The prototype flow lets a customer save a request as a draft, add optional allowed evidence, then submit it. Staff cannot see a draft, its timeline or its evidence until it is submitted. Customers can discard a draft or cancel an open request; uploaded files are retained privately, including on cancellation, until a retention rule is decided. Staff downloads go through an audited permission check. Customers cannot download their uploaded files yet. Files are treated as unverified customer submissions, not proof of ownership or official approval. At submission, customers accept the current service-scope notice; a human-readable case number is assigned then. Customers can state why they are asking, their relationship to the land, and whether they act for themselves or someone else. Staff see these as “Customer's claim, not verified.” Migration 024 is not hosted; see STATUS.md.

The pilot begins with synthetic or properly redacted evidence. Before real documents are accepted, Atexgrove needs approved terms and privacy information, explicit consent, minimum-necessary access, a retention/deletion process, an incident process and appropriate professional review of those rules.

Important evidence will use versions rather than silent replacement. If a customer supplies a clearer document, the new copy becomes the current version while the earlier copy and the review linked to it remain available to authorized reviewers until the applicable retention rule permits deletion.

## Testing and deployment

Connecting to hosted Supabase and applying reviewed migrations does not require Docker. Docker is used to create a temporary local Supabase system for database permission tests. GitHub Actions runs migrations and automated allow/deny tests in a temporary environment. Hosted migration history is 001-023 per owner confirmation; migration 024 is not hosted. Separate hosted-user testing is still required.

## The controlled case journey

The intended pilot journey has six understandable stages: request received, documents in, document checks, site and map, development options, and report. The current prototype covers case intake, staff assignment/review, private evidence, and customer clarification; maps, feasibility and reports are not yet implemented. In the case form, customers choose a council and listed area from menus (or mark that their area is not listed), then enter address details. Older requests that predate the structured form show the council and explain that detailed location was not recorded. The dashboard says whether the customer or Atexgrove needs to act next.

A customer may start a case, or authorized staff may assist with recorded consent. A human lead controls assignment; automation may only recommend. Important conclusions require review by a suitably qualified second person, while government or statutory evidence remains a separate authority level.

## Maps

Maps are planned for locating and understanding a site. A map image or boundary is not automatically an official survey, title record, cadastral boundary, or planning confirmation. The product must always show the source, date, location, and authority level of map information.

## Feasibility calculations

Development-feasibility results will come from visible inputs and repeatable calculations. They must show assumptions and limitations. They are estimates, not guarantees of profit, approval, cost, or development rights.

## Why everything stays in one application for now

The first prototype is deliberately one organized application instead of many separate services. This keeps cost and complexity low. Separate services should only be introduced later when scale or team ownership provides a real reason.

