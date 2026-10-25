# Atexgrove

Atexgrove is a prototype specification for a trusted digital ecosystem for land development in Africa. The initial demonstration geography is Abuja, Nigeria.

This folder contains the focused markdown specifications required to build the first end-to-end prototype.

For founder, partner, and non-engineering explanations, start with [`non-technical/README.md`](non-technical/README.md). The plain-language library summarizes the project story, product, security approach, roadmap, current progress, decisions, and working method without replacing these detailed specifications.

## Current delivery journey

The accepted delivery order puts the verification service before a land-discovery marketplace. `DECISIONS.md` is the decision source of truth. The remaining items in `OPEN-QUESTIONS-FOUNDER.md` refine people, policy, data and operational details; they do not reopen whether GIS or marketplace work comes first.

1. Register, choose a role, and sign in.
2. Start a land-verification and development-feasibility case.
3. Identify the Abuja/FCT site and submit synthetic or properly redacted private supporting evidence for the initial pilot; an existing listing or parcel is not required.
4. Route the case through assignment, evidence review, notes, status changes, and audit events.
5. Produce a reviewed Land & Development Report with explicit source and authority labels.
6. Add land discovery, mapping, projects, professionals, and wider development workflows only after the case workflow is proven.

All synthetic records must be clearly labelled **DEMO DATA / NOT OFFICIAL**.

## Reading order

1. `00-PROJECT-CONTEXT.md`
2. `01-PRD.md`
3. `02-SYSTEM-ARCHITECTURE.md`
4. `03-DATABASE-SCHEMA.md`
5. `04-API-SPEC.md`
6. `05-UI-UX-DESIGN.md`
7. `06-GIS-SPEC.md`
8. `07-AUTH-SECURITY.md`
9. `08-DOCUMENTS-SPEC.md`
10. `09-FEASIBILITY-SPEC.md`
11. `10-ROADMAP.md`
12. `11-FOLDER-STRUCTURE.md`
13. `12-IMPLEMENTATION-CHECKLIST.md`
14. `13-DEMO-DATA-GUIDE.md`
15. `14-BUILD-AGENT-INSTRUCTIONS.md`
16. `15-REQUIREMENTS-AND-TEST-STRATEGY.md`
17. `16-DESIGN-AND-INTEGRATION-PLAN.md`
18. `17-PROJECT-AUDIT.md`
19. `18-PROTOTYPE-FLOW-AND-DELIVERY-MAP.md`
20. `STATUS.md` — current implementation, CI evidence and hosted state
21. `RUNBOOK.md` — operator and local-development procedures
22. `KNOWN-ISSUES.md` — current product and operational gaps
23. `BACKLOG.md` — owner-request intake and triage
24. `RELEASE-PLAN.md` — planned hosting/release approach
25. `ENGINEERING-LOG.md` — dated problems, fixes and lessons

## Important

These documents intentionally separate the huge long-term Atexgrove vision from the smaller prototype implementation.

The original master prompt can remain as a product-vision document. These files are the operational build specification.

## Status

**Status date: 2026-10-25.** The linked hosted migration ledger reads `001`–`025`, checked after controlled history normalization on 2026-10-25; the ledger does not report the original apply times for migrations 024 or 025. Migration 021 was applied 2026-10-21 and migration 022 on 2026-10-23; 023 was applied after PR #26 merged, per owner confirmation. Migration 025 is merged and hosted. PR #29 added migration `026_pending_evidence_submission.sql`, which is merged and CI-verified but not hosted. Customer uploads under that implementation are restricted to draft or awaiting-information preparation; explicit customer submission releases pending files and only a customer reply resumes review. Check [STATUS.md](STATUS.md) for the distinction between implemented, CI-verified and hosted. Operational docs are indexed above.

Historical sections in `17-PROJECT-AUDIT.md` retain the status that was true on their stated dates. Use the latest dated audit addendum and the implementation itself for current status.
