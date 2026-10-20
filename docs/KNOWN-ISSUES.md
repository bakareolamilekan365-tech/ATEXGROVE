# Atexgrove Known Issues

**Status date:** 2026-10-20

This list distinguishes current gaps from planned work. It is not a production-readiness claim.

| Item | Current status | Planned direction |
| --- | --- | --- |
| Customer/staff context separation and role display | **Code fix merged:** [PR #17](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/17) separates customer queries and adds role/workspace display. Migration `020` is not hosted. | Operationally verify the merged UI and apply migration `020` only after separate hosted approval. |
| Staff UI displays raw user IDs | **Open:** work-queue/detail screens show identifiers rather than safe display names. | Resolve names through an authorized profile/staff view without broadening profile access. |
| Privacy, Terms and cookie pages | **Not implemented.** | Required, with appropriate legal/privacy review, before real customer documents or production use. |
| Account deletion versus `on delete restrict` | **Open design issue:** evidence/customer references can block Auth-user deletion. | Define retention, anonymization, legal hold and deletion behavior before real use. |
| Customer retrieval of uploaded evidence | **Not implemented:** customers can upload and see metadata but cannot download their own stored object. | Add an explicitly authorized, audited customer retrieval path in a later reviewed slice. |
| Unregistered uploads and the 10-file limit | **Known limit:** the count uses registered `case_evidence` rows, so an object whose registration never completes is not counted. | Keep server cleanup and add stronger orphan cleanup/reconciliation when operational needs justify it. |
| Virus scanning | **Unavailable in the current Free-plan slice.** Files are untrusted, allowlisted and download-only. | Add a replaceable malware-scanning integration before real-document use where required. |
| Role-based onboarding routing | **Undecided / not implemented.** | Keep onboarding neutral until the product decision is recorded; do not infer staff access from platform role. |
| Login `?next=` handling | **Open:** login currently ignores the requested safe internal destination. | Add validated relative redirect handling; never allow open redirects. |

Operational verification gaps are maintained in [STATUS.md](STATUS.md), not duplicated here.
