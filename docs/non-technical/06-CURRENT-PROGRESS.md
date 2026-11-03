# Current progress

**As of 3 November 2026.**

## Observed in isolated staging

- Separate Netlify/Supabase environment exists with migrations `001`–`026`.
- Two Auth accounts, one active Verification Lead separate from the customer, and one numbered submitted fictional case.
- One registered private evidence upload and associated submission consent/status history.
- The Verification Lead can see the submitted case in the staff queue.

## Still to verify

- Full Lead evidence access, staff assignments, unrelated-user isolation and forbidden actions.
- Large-file upload sizes, interrupted upload handling and email/account recovery.
- Provider-level signup restrictions, access for Board accounts, backup/recovery and security-review gates.
- PR #33 UI behavior: it is paused and unmerged, not deployed from that branch. PR #34 preflight remains draft.

## Later, not in the frozen preview

Full departmental hierarchy, North/South coverage, formal handovers and approvals, Feasibility/Operations workflows, executive dashboards, reports, GIS, payments and production policy/legal readiness.

The originally planned 12–20 November period may be postponed; no new date is decided. No Board preview accounts have been created.

See [technical status](../STATUS.md) and [release gates](../RELEASE-PLAN.md).
