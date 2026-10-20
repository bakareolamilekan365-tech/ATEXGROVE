# The Atexgrove project story

## Why the project started

Atexgrove began as a broad idea for bringing land, construction, professionals, documents, projects, and development information into one trusted digital environment. The vision is large, but the first repository needed to prove one useful journey instead of showing many disconnected screens.

## The first foundation

The project was organized as a web application with a managed online database. The team created the repository, documented the product vision, prepared the first database structure, and added the basic account journey.

The first working user journey became:

1. Register an account.
2. Sign in.
3. Choose a basic account type.
4. Save profile information.
5. Reach a protected dashboard.

The hosted Supabase project first received fourteen database changes. On 2026-10-14, changes `015`-`017` were also recorded remotely, adding stronger organization/member protections and the private-document storage foundation.

## Why the audit became necessary

The early documentation described a much larger product than the code actually delivered. Some screens and database files were placeholders. The audit was introduced to separate:

- what genuinely works;
- what exists in code but still needs proof;
- what is only planned;
- what belongs to the long-term vision.

This was important because a professional-looking screen is not proof that permissions, private documents, database rules, and failure handling work correctly.

## The security work

The security branch strengthened the existing foundation. It added or improved:

- protection against users promoting themselves to administrator;
- restrictions on creating fake verified organizations;
- protection for organization owners and membership records;
- private document-storage rules;
- safer password-recovery redirects;
- tests for allowed and forbidden database actions;
- GitHub automation for testing database changes before they are merged.

Two database changes initially failed because they attempted to change tables owned by Supabase itself. Those statements were removed. Audit triggers were also removed from Supabase's managed Storage table; Slice 2 now records document access and evidence events through Atexgrove's controlled application/database workflow instead.

## Current repository and database state

See [../STATUS.md](../STATUS.md) for the single current record of what is implemented, what is deployed, which automated checks passed and what still requires real hosted-user verification.

## Product direction changed

The original plan leaned toward land discovery and maps as the next major feature. On 2026-10-14, the roadmap was confirmed around a controlled Abuja/FCT pilot:

> A customer or authorized staff member opens a case for an Abuja/FCT site, evidence is checked through a six-stage journey, and a limited report clearly separates Atexgrove review, specialist review, official-source evidence and unresolved questions.

Public land discovery and mapping now come after this controlled case workflow has been proven. The early pilot uses synthetic or redacted evidence. Real documents are blocked until the required terms, privacy, consent, access, retention, deletion and incident processes are implemented and professionally reviewed.

## Brand preparation

The project name is Atexgrove. Supplied logo images have been preserved and converted into practical web formats for later use. The current logo source is photographic/raster artwork; a true editable vector should still be requested from the original designer before large-format printing.

## Where the project stands

Current progress and remaining operational gates are maintained in [../STATUS.md](../STATUS.md); this story preserves the project history and accepted verification-first direction.

