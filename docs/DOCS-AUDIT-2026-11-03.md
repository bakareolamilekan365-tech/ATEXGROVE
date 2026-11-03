# Docs folder reconciliation — 3 November 2026

**Purpose:** distinguish dated engineering history, product requirements, current staging evidence and unmerged PR behavior. This audit does not substitute for code security or visual acceptance.

## Confirmed stale material

| Area | Earlier statement / problem | Disposition |
| --- | --- | --- |
| `STATUS.md` | October snapshot denied staging/deployment | Add independently verified November staging snapshot; retain historical tests |
| `RELEASE-PLAN.md` | Everything described as planned/unconfigured | Replace with actual limited staging status and outstanding invitation gates |
| `non-technical/05-ROADMAP-AND-NEXT-STEPS.md` | Phase 1 at migrations `001`–`017` and Phase 2 still next | Replace with present migrations `001`–`026` and current work sequence |
| `KNOWN-ISSUES.md` | Missing current PR, Board access, login-image feedback and schedule status | Add dated exceptions; retain older technical issues |
| `BACKLOG.md` | October tasks appeared to be immediate priority | Record PR #34 active, PR #33 paused, frozen scope |
| `DECISIONS.md`, `10-ROADMAP.md`, both READMEs | Current execution context not explicit | Record scope freeze and dated status |
| `non-technical/06-CURRENT-PROGRESS.md` | Did not describe actual staging acceptance | Record observed checks and open gates separately |

## Document families inspected

- **Current operational guidance:** `README.md`, `STATUS.md`, `RELEASE-PLAN.md`, `RUNBOOK.md`, `KNOWN-ISSUES.md`, `BACKLOG.md`, `DECISIONS.md`, `12-IMPLEMENTATION-CHECKLIST.md`, `SUPABASE-DASHBOARD-CHECKLIST.md`.
- **Specifications, not proof of deployment:** `00-PROJECT-CONTEXT.md` through `16-DESIGN-AND-INTEGRATION-PLAN.md`, `18-PROTOTYPE-FLOW-AND-DELIVERY-MAP.md`, `DEVELOPMENT-CONTROL-MODULE.md`, `TRUST-AND-ROLES-DECISION-DRAFT.md`, `OPEN-QUESTIONS-FOUNDER.md`.
- **Dated historical records:** `17-PROJECT-AUDIT.md`, `ENGINEERING-LOG.md`, `PRD-REVISION-BRIEF.md` and past migration/CI snapshots.
- **Plain-language companions:** `non-technical/` README, project story, product description, user flow, security, roadmap, progress, decisions, working method and glossary.
- **References:** `references/` contains external design notes, approved UI ZIP/PDF material and other source references. These are design inputs, not working feature evidence.

## Current source-of-truth order

1. For observed state, use the dated first section of [STATUS.md](STATUS.md) and the actual code/environment.
2. For invitation decisions and risk gates, use [RELEASE-PLAN.md](RELEASE-PLAN.md) and [KNOWN-ISSUES.md](KNOWN-ISSUES.md).
3. For accepted decisions, use [DECISIONS.md](DECISIONS.md); approval in principle does not prove implementation.
4. For future design, use the specifications and the appropriate authorized executive materials; do not publish private company correspondence in this public repository.
5. For PR code, inspect the PR at its real head. Do not confuse PR #33's unmerged implementation with the deployed `main` application or PR #34's draft build guards with active production-context protection.

## PR #33 feedback to preserve as audit inputs

Prior reviews include: blurred architectural image requested for login/signup (distinct from the landing hero), auth loading and account navigation, oversized case cards, filters and suggestions, recent-activity organization, progress labels/colours, consent-before-contact behavior, branding/theme controls, staff Assign visibility, responsive loading/error states and visual comparisons with supplied references.

These are **reported requirements or potential regressions**, not a claim that every item is still broken. The final PR head has not been visually accepted in an authenticated browser. The Light-first-visit claim in PR #33 conflicts with a later System-first preference note; resolve explicitly.

The floating help control and unimplemented Feasibility, Operations, handover, second review, staff hierarchy and report features must not be added to the frozen preview by documentation alone.

## Publishing and change boundaries

This repository is public. Do not commit privileged credentials, Auth identifiers, real evidence, participant details or private executive responses. This reconciliation changes documentation only; no application code, migration, CI, dependency, configuration, deployment or database is changed.
