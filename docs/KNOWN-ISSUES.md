# Atexgrove Known Issues

**Status date:** 2026-10-22

This list distinguishes current gaps from planned work. It is not a production-readiness claim.

| Item | Current status | Planned direction |
| --- | --- | --- |
| Customer/staff context separation and role display | **Code fix merged and schema hosted:** [PR #17](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/17) separates customer queries and adds role/workspace display. Migration `020_customer_safe_status.sql` was applied to hosted Supabase on 2026-10-20. | Operationally verify the merged UI with separate customer, staff and dual-role accounts. |
| Staff UI displays raw user IDs | **Open:** work-queue/detail screens show identifiers rather than safe display names. | Resolve names through an authorized profile/staff view without broadening profile access. |
| Privacy, Terms and cookie pages | **Not implemented.** | Required, with appropriate legal/privacy review, before real customer documents or production use. |
| Account deletion versus `on delete restrict` | **Open design issue:** evidence/customer references can block Auth-user deletion. | Define retention, anonymization, legal hold and deletion behavior before real use. |
| Customer retrieval of uploaded evidence | **Not implemented:** customers can upload and see metadata but cannot download their own stored object. | Add an explicitly authorized, audited customer retrieval path in a later reviewed slice. |
| Unregistered uploads and the 10-file limit | **Known limit:** the count uses registered `case_evidence` rows, so an object whose registration never completes is not counted. | Keep server cleanup and add stronger orphan cleanup/reconciliation when operational needs justify it. |
| Virus scanning | **Unavailable in the current Free-plan slice.** Files are untrusted, allowlisted and download-only. | Add a replaceable malware-scanning integration before real-document use where required. |
| Role-based onboarding routing | **Undecided / not implemented.** | Keep onboarding neutral until the product decision is recorded; do not infer staff access from platform role. |
| Login `?next=` handling | **Open:** login currently ignores the requested safe internal destination. | Add validated relative redirect handling; never allow open redirects. |
| Data API grants for new public tables | **Upcoming platform change:** from 2026-10-30, Supabase stops automatically granting Data API access to newly created tables in `public`. Existing tables are unaffected. | Every new-table migration must grant `SELECT` explicitly to `authenticated` only, grant `service_role` access only as needed, grant no access to `anon`, and keep writes behind secured RPCs. RLS remains required and separate from grants. |
| Final logo application assets | **Resolved:** owner-confirmed logo, mark and wordmark SVGs are in `public/logo`; the mark is used in the staff header and as the favicon. | No open action. |
| Customer and staff roles on one account | **By design:** one account may be both a customer and staff member; the identities are kept in separate tables. Customer and staff screens must keep their data contexts separate. | Keep dual-role accounts in regression tests. |
| Upload timing | **Current limitation:** customers can add documents only after the case request is submitted. Upload during case creation is not implemented. | Next: create a draft case, allow uploads, then submit. |
| Idle session timeout | **Not implemented:** the Supabase session persists in its cookie until it expires or the user signs out. | Timeout policy is an open decision; no idle timeout is claimed. |
| FCT area names | **Prototype list:** council areas are a starter list, not official. | Owner confirmation is still needed before presenting them as authoritative. |
| Assignment event visibility, strict council/area input and phone contact | **Implemented in PR #24; CI-verified, not hosted.** | Do not claim these changes as deployed before review and hosted application. |

Operational verification gaps are maintained in [STATUS.md](STATUS.md), not duplicated here.
