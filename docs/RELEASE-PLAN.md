# Release plan

**Status: 2026-11-03 — isolated staging exists; preview invitation NOT approved.** This supersedes the earlier plan that said staging and hosting were not configured.

## Frozen scope and provisional schedule

The private executive preview demonstrates only existing, reviewed verification-first capabilities using fictional data. No new features or organizational restructuring are authorized for this frozen scope. The original **12–20 November 2026** target may be postponed; no new date has been approved. Do not announce dates or issue invitations until readiness and access are confirmed.

## Environment and branch status

- The separate staging Supabase ledger has migrations `001`–`026`; a ready Netlify deployment has supported limited customer and Verification Lead smoke tests.
- `main` (`4f9fe95`) is the deployed baseline. PR #33 is open, paused and unmerged, so its UI work has not been visually accepted or deployed on `main`.
- PR #34 is a draft/unmerged staging-preflight PR. A preview/branch-build guard does not automatically protect the deployed Netlify production-context build.
- The site uses Netlify team-login restrictions. Free-tier access by Board members must be validated rather than assumed.
- The budget remains **₦0 / $0**. Use separate staging credentials, never the existing hosted Supabase project's credentials, and do not introduce paid integrations.

## Outstanding invitation gates

1. Confirm Supabase Auth provider-level signup restrictions, individual account provisioning, email confirmation/recovery and redirect settings.
2. Test customer, Verification Lead, regular-staff and unrelated-user permissions, including negative RLS tests and forbidden actions.
3. Complete an end-to-end fictional case journey including Lead evidence access, assignment, staff updates and genuine customer-visible milestones.
4. Test synthetic uploads near 1, 5 and 9–10 MiB, interrupted uploads, registration state and safe orphan handling. Only a small PNG upload has passed the observed staging check.
5. Review security-advisor findings, dependency/runtime support, Netlify build-context safeguards, backup/recovery and the ability of Board participants to access the private site.
6. Rehearse the actual demonstration with controlled fictional accounts and label incomplete or demonstration-only capabilities honestly.
7. Obtain a deliberate readiness and scheduling decision before sending invitations.

No Board/Owner preview accounts have yet been provisioned. No real client evidence, public launch, official verification, payment collection or unapproved staff privileges are permitted.

## Later architecture

Detailed staffing hierarchy, North/South coverage, Feasibility, Operations, handover acceptance, approvals, professional reports, governance and CEO/Board interfaces are separate post-preview design and implementation concerns. Earlier January staff-identity targets remain planning targets, not delivery evidence.

See [STATUS.md](STATUS.md), [RUNBOOK.md](RUNBOOK.md) and [KNOWN-ISSUES.md](KNOWN-ISSUES.md).
