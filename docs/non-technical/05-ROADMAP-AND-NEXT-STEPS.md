# Roadmap and next steps

## The delivery order

The roadmap has been reorganized around a verification-first service:

### Phase 0 — Agree the direction

The controlled Abuja/FCT pilot, six-stage journey, responsibility boundaries, trust-label structure, no-payment rule and real-document readiness gate are agreed. Named reviewers, report wording, retention periods, company details and licensed data sources remain open.

### Phase 1 — Foundation

Accounts, profiles, organizations, database protection, private-storage rules, tests, and a basic dashboard.

This phase is near completion. PR #9 is merged, migrations `001`-`017` are deployed, and both general CI and temporary-database pgTAP workflows passed for the merged PR head. Hosted-user document isolation, hosted account-email flows, the remaining Supabase advisor findings and the `organization_actor_role` anonymous-permission fix still require closure or an explicit risk decision.

### Phase 2 — Verification case and private evidence

Build the first real business journey:

- customer request form;
- Abuja site details;
- private evidence upload;
- case submission;
- staff work queue;
- assignment and handover;
- status history and review notes;
- permission checks and audit history.

The case follows six customer-facing stages: request received, documents in, document checks, site and map, development options, and report. A customer may start it directly or receive audited staff assistance. A human lead controls assignment, and a suitably qualified second reviewer is required for consequential conclusions.

This is the next implementation phase.

### Phase 3 — Feasibility and report

Add clear assumptions, repeatable calculations, discipline-appropriate second review, and delivery of a deliberately limited report. The report must separate Atexgrove review, professional conclusions, official-source evidence, estimates and unresolved matters.

### Phase 4 — Controlled land discovery and maps

Add clearly labelled demonstration parcels, filters, map views, and source information after the controlled case workflow works.

### Phase 5 — Projects and professionals

Allow completed cases or parcels to become controlled project workspaces with scoped participation.

### Phase 6 — Release confidence

Complete full user-journey testing, accessibility, failure states, operational checks, and a deployable preview.

## What happens immediately

1. Add and test a forward migration that removes anonymous execute access from `organization_actor_role`.
2. Test real email confirmation and password recovery, including invalid/expired links.
3. Test hosted cross-user document isolation using realistic authenticated sessions.
4. Review the remaining Supabase security and performance findings and either fix or explicitly accept each one.
5. Confirm no exposed service-role secret remains in use and rotate any credential that was shared outside secure storage.
6. Complete and professionally review the terms, privacy, consent, retention/deletion and incident rules before accepting real evidence.
7. Identify the first pilot participants and qualified second reviewers.
8. Design and build the Phase 2 journey from database rules to a simple working interface using synthetic/redacted evidence first.

## What should not happen next

- another open-ended foundation rewrite;
- polished disconnected screens;
- public land marketplace work before the case workflow;
- payments;
- AI processing of real pilot documents;
- Kubernetes or complex infrastructure;
- claims that planned features already work.

