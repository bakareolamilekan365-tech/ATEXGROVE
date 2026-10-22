# Atexgrove in plain English

This folder explains Atexgrove for founders, partners, advisers, future team members, and anyone who does not need the engineering details.

The files in the parent `docs/` folder remain the detailed source of truth. These versions explain the same direction in simpler language and must never be used to exaggerate what has been built.

**Status date: 2026-10-22.** Hosted Supabase is at migrations `001`-`021` (021 applied 2026-10-21). The case workflow and private evidence slice are implemented. Migration 022 and sign-out are implemented on the current PR branch, but CI verification is pending and 022 is not hosted. See the technical [STATUS.md](../STATUS.md) for evidence and open operational checks.

## Suggested reading order

1. [01-PROJECT-STORY.md](01-PROJECT-STORY.md) — what has happened since the project began.
2. [02-WHAT-WE-ARE-BUILDING.md](02-WHAT-WE-ARE-BUILDING.md) — the product, users, and first commercial service.
3. [03-HOW-IT-WORKS.md](03-HOW-IT-WORKS.md) — how the product works without engineering jargon.
4. [04-TRUST-SECURITY-AND-DOCUMENTS.md](04-TRUST-SECURITY-AND-DOCUMENTS.md) — how access, evidence, and private documents should be handled.
5. [05-ROADMAP-AND-NEXT-STEPS.md](05-ROADMAP-AND-NEXT-STEPS.md) — the delivery order and the next real feature.
6. [06-CURRENT-PROGRESS.md](06-CURRENT-PROGRESS.md) — what works, what is waiting, and what is not built.
7. [07-DECISIONS-NEEDED.md](07-DECISIONS-NEEDED.md) — approved pilot decisions and the questions still open.
8. [08-HOW-WE-WORK.md](08-HOW-WE-WORK.md) — how changes are planned, tested, and accepted.
9. [GLOSSARY.md](GLOSSARY.md) — simple definitions of common project terms.

For current operations and delivery status, see [STATUS](../STATUS.md), [RUNBOOK](../RUNBOOK.md), [KNOWN-ISSUES](../KNOWN-ISSUES.md), [BACKLOG](../BACKLOG.md), [RELEASE-PLAN](../RELEASE-PLAN.md), and [ENGINEERING-LOG](../ENGINEERING-LOG.md).

## Coverage of the technical documents

| Technical document | Plain-language companion |
| --- | --- |
| `00-PROJECT-CONTEXT.md`, `01-PRD.md`, `PRD-REVISION-BRIEF.md` | `02-WHAT-WE-ARE-BUILDING.md` |
| `02-SYSTEM-ARCHITECTURE.md`, `03-DATABASE-SCHEMA.md`, `04-API-SPEC.md`, `11-FOLDER-STRUCTURE.md` | `03-HOW-IT-WORKS.md` |
| `05-UI-UX-DESIGN.md`, `06-GIS-SPEC.md`, `09-FEASIBILITY-SPEC.md` | `02-WHAT-WE-ARE-BUILDING.md` and `05-ROADMAP-AND-NEXT-STEPS.md` |
| `07-AUTH-SECURITY.md`, `08-DOCUMENTS-SPEC.md`, `TRUST-AND-ROLES-DECISION-DRAFT.md` | `04-TRUST-SECURITY-AND-DOCUMENTS.md` |
| `10-ROADMAP.md`, `18-PROTOTYPE-FLOW-AND-DELIVERY-MAP.md` | `05-ROADMAP-AND-NEXT-STEPS.md` |
| `12-IMPLEMENTATION-CHECKLIST.md`, `17-PROJECT-AUDIT.md`, `SUPABASE-DASHBOARD-CHECKLIST.md` | `01-PROJECT-STORY.md` and `06-CURRENT-PROGRESS.md` |
| `13-DEMO-DATA-GUIDE.md`, `14-BUILD-AGENT-INSTRUCTIONS.md`, `15-REQUIREMENTS-AND-TEST-STRATEGY.md`, `16-DESIGN-AND-INTEGRATION-PLAN.md`, `SDLC.md` | `08-HOW-WE-WORK.md` |
| `DECISIONS.md`, `OPEN-QUESTIONS-FOUNDER.md` | `07-DECISIONS-NEEDED.md` |

## Honesty rule

Use these labels consistently:

- **Working:** people can use it and it has been checked.
- **Built but awaiting verification:** the code exists, but the full environment test is not complete.
- **Planned:** agreed direction with no complete working feature yet.
- **Future:** outside the first prototype.

