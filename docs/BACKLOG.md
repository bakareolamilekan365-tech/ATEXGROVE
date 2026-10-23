# Product backlog — master list

This is the single master list for product gaps and owner requests. Items are **Planned** unless their status explicitly records existing implementation, CI evidence, or hosted state. “Tier not assigned” means the supplied priority map did not place that item; it is not a priority decision.

Tier A: immediate post-022 foundation/customer intake. Tier B: Phase 2 / Slice 3 verification workflow. Tier C: demo and UX polish. Tier D: real-user/legal/security readiness. Tier E: Phase 3 feasibility and Land & Development Report. Tier F: Phase 4 and later. See [RUNBOOK.md](RUNBOOK.md) for owner-request intake and delivery rules.

| ID | Actor | Item | Tier | Status |
| --- | --- | --- | --- | --- |
| <a id="c-01"></a>C-01 | Customer | Public landing page explaining Abuja service, Land Verification, trust limits, FAQs and clear entry points | C | Planned |
| <a id="c-02"></a>C-02 | Customer | Versioned Terms acceptance record at account registration | D — lawyer review | Planned |
| <a id="c-03"></a>C-03 | Customer | Separate Privacy Notice acknowledgement with purpose and access explanation | D — lawyer review | Planned |
| <a id="c-04"></a>C-04 | Customer | Consent records for distinct account, case, document and sharing purposes | A — minimal case-scope record; D — full model with lawyer review | Minimal case-scope record implemented in this PR; full model remains Planned for D and lawyer review |
| <a id="c-05"></a>C-05 | Customer | Terms, privacy and cookie/data-handling pages | C — draft pages; D — lawyer-reviewed publication | Planned |
| <a id="c-06"></a>C-06 | Customer | Deliberate multi-step customer onboarding | C | Planned |
| <a id="c-07"></a>C-07 | Customer | Replace the low-value profile bio with useful customer/business information | C | Planned |
| <a id="c-08"></a>C-08 | Customer | Capture self/another-person/organization representation and principal name during case intake | A | Implemented in this PR; CI pending; 024 not hosted |
| <a id="c-09"></a>C-09 | Customer | Distinguish the principal/land-interest holder from the logged-in representative | A | Implemented in this PR; CI pending; 024 not hosted |
| <a id="c-10"></a>C-10 | Customer | Separate identity-verification states from profile completion, after legal/privacy review | D | Planned |
| <a id="c-11"></a>C-11 | Customer | Customer phone verification for sensitive workflows | D | Planned |
| <a id="c-12"></a>C-12 | Customer | Account trust/status view that keeps email, phone, identity, organization and professional states separate | D | Planned |
| <a id="c-13"></a>C-13 | Customer | Capture the customer’s reason for requesting verification | A | Implemented in this PR; CI pending; 024 not hosted |
| <a id="c-14"></a>C-14 | Customer | Capture claimed relationship to the land without treating it as proof | A | Implemented in this PR; CI pending; 024 not hosted |
| <a id="c-15"></a>C-15 | Customer | Structured Abuja/FCT council, starter area and site details | A | Implemented; CI-verified in runs 39909627609 and 39909627678; migration 022 hosted 2026-10-23 |
| <a id="c-16"></a>C-16 | Customer | Human-readable case reference instead of UUID fragments | A | Implemented in this PR; CI pending; 024 not hosted |
| <a id="c-17"></a>C-17 | Customer | Record case-scope service consent and clear authority limitations before submission | A | Minimal record implemented in this PR; full lawyer-reviewed consent model remains Planned for D; CI pending; 024 not hosted |
| <a id="c-18"></a>C-18 | Customer | Show the six-stage case progress journey in the product | B | Planned |
| <a id="c-19"></a>C-19 | Customer | Show plainly who must act next on each case | A | Implemented in this PR; CI pending; 024 not hosted |
| <a id="c-20"></a>C-20 | Customer | Evidence checklist guidance, purpose and supplied count; deeper gap/review state remains planned | A | Guidance slice implemented in this PR; CI pending; 024 not hosted |
| <a id="c-21"></a>C-21 | Customer | Authorized short-lived download access to the customer’s own uploads | B | Planned; requires a reviewed customer-access path |
| <a id="c-22"></a>C-22 | Customer | Evidence findings linked to exact versions, reviewers, sources and limits | B | Planned |
| <a id="c-23"></a>C-23 | Customer | Clear evidence review states from receipt through inconclusive/rejected outcomes | B | Planned |
| <a id="s-24"></a>S-24 | Staff/admin | Department/team structure, membership, workload and availability states | F | Planned |
| <a id="s-25"></a>S-25 | Staff/admin | Reviewer accept/decline response with a required reason | B | Planned |
| <a id="s-26"></a>S-26 | Staff/admin | Reassignment/handover with acceptance and preserved history (B); cross-department transfers are a later extension (F) | B / F | Planned |
| <a id="s-27"></a>S-27 | Staff/admin | Lead view of reviewer workload and capacity | F | Planned |
| <a id="s-28"></a>S-28 | Staff/admin | Controlled case escalation for conflicts, external input, inactivity or deadlines | F | Planned |
| <a id="s-29"></a>S-29 | Staff/admin | Structured case closure reasons beyond the generic closed status | B | Planned |
| <a id="p-30"></a><a id="p-a"></a><a id="p-19"></a>P-30 | Professional | Minimal staff-entered review record: reviewer name, discipline, credential relied on, source/check date, assigned scope and decision; label “recorded by Atexgrove, not independently verified”; no external login | B / E | Planned |
| <a id="p-31"></a>P-31 | Professional | Fuller professional credential lifecycle (expiry and re-verification) and engagement workflow | F | Planned |
| <a id="p-32"></a>P-32 | Professional | Case-specific consent record before any document is shared outside the platform; no external sharing before the D readiness gate is met | B — D gate | Planned |
| <a id="p-33"></a><a id="p-c"></a><a id="p-08"></a><a id="p-09"></a>P-33 | Professional | Professional conflict declarations and automatic separation of preparer from independent reviewer | B | Planned; merges earlier P-c and second-list items 8–9 |
| <a id="r-34"></a>R-34 | Report/map | Contextual case map that is clearly not a legal/cadastral boundary | F | Planned |
| <a id="r-35"></a>R-35 | Report/map | Deterministic feasibility calculations with visible assumptions and outputs | E | Planned |
| <a id="r-36"></a>R-36 | Report/map | Comparable feasibility scenarios without silent assumption changes | E | Planned |
| <a id="r-37"></a>R-37 | Report/map | Report lifecycle from draft through reviews and delivery | E | Planned |
| <a id="r-38"></a>R-38 | Report/map | Versioned report with exact evidence and assumption lineage | E | Planned |
| <a id="r-39"></a>R-39 | Report/map | Discipline-specific sign-off for professional report conclusions | E | Planned |
| <a id="c-40"></a>C-40 | Customer | Customer report centre with version, delivery, unresolved items and download access | E | Planned |
| <a id="c-41"></a>C-41 | Customer | In-app notification centre for case progress and report events; email remains later | C | Planned; no email provider is selected |
| <a id="c-42"></a>C-42 | Customer | Case-linked customer support/contact workflow | F | Planned |
| <a id="x-43"></a>X-43 | Compliance | Real-document readiness gate before accepting real customer evidence | D | Planned; lawyer review required |
| <a id="x-44"></a>X-44 | Compliance | Retention, deletion, audit-record and backup-handling rules | D | Planned; lawyer review required |
| <a id="x-45"></a>X-45 | Compliance | Malware scanning for real customer documents | D | Planned |
| <a id="x-46"></a>X-46 | Compliance | Operational security controls: isolation tests, limits, monitoring, incident response and recovery | D | Planned |
| <a id="s-47"></a>S-47 | Staff/admin | Authorized staff/professional administration without direct database edits | D | Planned |
| <a id="l-48"></a>L-48 | Later | Convert an eligible completed case into a permissioned project workspace | F | Planned |
| <a id="l-49"></a>L-49 | Later | Separate Development Control module, including AMAC-first checklist/readiness intake | F | Planned; after Slice 3; not started |
| <a id="l-50"></a>L-50 | Later | In-app assistance request from a missing Development Control requirement | F | Planned |
| <a id="l-51"></a>L-51 | Later | Scoped quotation, customer review and explicit work authorization | F | Planned; never authorize costs implicitly |
| <a id="p-52"></a>P-52 | Professional | Scoped professional work delivery and responsibility records | F | Planned |
| <a id="l-53"></a>L-53 | Later | Versioned resubmission/deficiency loop preserving originals and responsible parties | F | Planned |
| <a id="l-54"></a>L-54 | Later | Record official-authority responses separately from Atexgrove conclusions | F | Planned |
| <a id="l-55"></a>L-55 | Later | Payments through a licensed provider after company and legal/consumer readiness | F | Planned; no payments now |
| <a id="l-56"></a>L-56 | Later | Controlled Abuja land discovery and GIS after the case/report workflow | F | Planned |
| <a id="p-57"></a>P-57 | Professional | Full professional directory/marketplace after verification and access controls | F | Planned |
| <a id="l-58"></a>L-58 | Later | Wider construction, property, finance and urban-intelligence modules | F | Planned; workflows need definition |
| <a id="c-59"></a>C-59 | Customer | Required-items request within the case workflow | B | Planned; not started |
| <a id="c-60"></a>C-60 | Customer | Upload documents while creating a case (create draft, upload, then submit) | A — immediately after migration 022 | Implemented; CI-verified in runs [39950544017](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39950544017) and [39950544756](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39950544756); migration 023 hosted after PR #26 merged (owner confirmation) |
| <a id="c-61"></a>C-61 | Customer | Prevent duplicate cases when a submitted request is replayed | Completed — 021 | Done; migration 021 hosted (applied 2026-10-21) |
| <a id="c-62"></a>C-62 | Customer | Distinguish a customer response from an information request | Completed — 021 | Done; migration 021 hosted (applied 2026-10-21) |
| <a id="c-63"></a>C-63 | Customer | Sign out from customer and staff workspaces using a POST action | Current PR | Implemented; CI-verified in run 39909627609; not hosted |
| <a id="c-64"></a>C-64 | Customer | Decide whether an idle session timeout is needed | Decision | Not decided; no idle timeout exists today |
| <a id="c-71"></a>C-71 | Customer | Cancel an open verification request and optionally explain why | Current PR | Implemented; CI-verified in runs [39950544017](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39950544017) and [39950544756](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39950544756); migration 023 hosted after PR #26 merged (owner confirmation) |
| <a id="c-72"></a>C-72 | Customer | Define retention and cleanup for discarded drafts and their evidence | Decision | Not decided; 023 keeps drafts and files |
| <a id="c-73"></a>C-73 | Customer | Let customers delete evidence attached to their own draft | F | Planned; draft evidence is retained for now |
| <a id="s-a"></a>S-a | Staff/admin | Staff conflict declarations and prevention of assigning a case to its own customer; separate staff conflict declaration from automatic assignment checks | B — Slice 3 | Planned; current assignment RPC has no conflict-of-interest check |
| <a id="s-b"></a>S-b | Staff/admin | Search, filter and sort the staff case queue | F | Planned |
| <a id="s-c"></a><a id="s-31"></a><a id="s-70"></a>S-c | Staff/admin | Case and assignment due dates, overdue flags/reminders, and internal service targets (not legal guarantees) | F | Planned |
| <a id="s-d"></a>S-d | Staff/admin | Lead-absence delegation | F | Planned |
| <a id="s-e"></a>S-e | Staff/admin | Lead-facing audit-log viewer | F | Planned |
| <a id="s-f"></a>S-f | Staff/admin | Stricter staff session policy | F | Planned; separate from the undecided customer idle-timeout policy |
| <a id="s-g"></a>S-g | Staff/admin | Safe staff display names instead of raw user IDs | B | Planned |
| <a id="p-b"></a>P-b | Professional | Accept or decline a scoped case invitation | B | Planned |
| <a id="p-d"></a><a id="p-16"></a><a id="p-17"></a><a id="p-18"></a><a id="p-39"></a>P-d / P-16–P-18 / P-39 | Professional | Per-assignment, time-limited, revocable access to selected case documents, with document-level access audit | D | Planned; move to B/E only if external professionals log in during Phase 3 (open decision) |
| <a id="p-e"></a><a id="p-24"></a><a id="p-25"></a><a id="p-26"></a>P-e / P-24–P-26 | Professional | Deliverable acceptance, version history, scope/capacity sign-off and internal QA before customer completion | F | Planned |
| <a id="p-f"></a>P-f | Professional | Professional work dashboard and individual activity history | F | Planned |
| <a id="p-g"></a>P-g | Professional | Professional fees and invoices, coordinated with later payments | F | Planned |
| <a id="s-60"></a>S-60 | Staff/admin | Assignment creates one fixed customer update and one private staff note | Current PR | Implemented; CI-verified in runs 39909627609 and 39909627678; migration 022 hosted 2026-10-23 |
| <a id="c-65"></a>C-65 | Customer | Optional consented Nigerian contact number for phone/WhatsApp case contact | Current PR | Implemented; CI-verified in runs 39909627609 and 39909627678; migration 022 hosted 2026-10-23 |
| <a id="c-66"></a>C-66 | Customer | Owner-confirmed Atexgrove mark, logo and wordmark | Completed | Done (merged) |
| <a id="c-67"></a>C-67 | Customer | Revisit a repo-wide blue palette change | Decision | Undecided; revisit later |
| <a id="c-68"></a>C-68 | Customer | Loading skeletons and accessible keyboard shortcuts | C | Planned; shortcuts require modifier or opt-out/remap control |
| <a id="s-61"></a>S-61 | Staff/admin | Authorized staff invitation and onboarding flow | D | Planned |
| <a id="s-62"></a>S-62 | Staff/admin | Staff offboarding that immediately revokes access and routes assigned work for review | D | Planned |
| <a id="s-64"></a>S-64 | Staff/admin | Define Team Lead versus Department Lead authority and scope | F | Planned |
| <a id="p-10"></a>P-10 | Professional | Permit an internal professional to hold a separate professional context without inheriting staff authority | F | Planned |
| <a id="p-11"></a>P-11 | Professional | Add the missing professional workspace/context; customer and staff contexts are partly implemented (PR #17) | F | Planned |
| <a id="p-12"></a>P-12 | Professional | Represent the individual professional separately from their firm and record firm representative authority | F | Planned |
| <a id="p-14"></a>P-14 | Professional | Classify an engagement by task, such as review, preparation, inspection, correction or consultation | F | Planned |
| <a id="p-20"></a>P-20 | Professional | Suspend new assignments without deleting historical professional records | F | Planned |
| <a id="p-21"></a>P-21 | Professional | Keep professional complaints and disputes separate from customer case findings | F | Planned |
| <a id="p-23"></a>P-23 | Professional | Record operational performance history without a vague trust score | F — later, maybe | Planned; defer decision |
| <a id="p-27"></a>P-27 | Professional | Have staff check external work against its agreed scope before customer completion | F | Planned |
| <a id="p-28"></a>P-28 | Professional | Let independent reviewers return findings for correction before approval | B | Planned |
| <a id="s-69"></a>S-69 | Staff/admin | Give professional reviews their own workload queue, distinct from ordinary operations | F | Planned |
| <a id="s-71"></a>S-71 | Staff/admin | Distinguish internal service targets from legally guaranteed deadlines | F — later, maybe | Planned; defer decision |
| <a id="s-72"></a>S-72 | Staff/admin | Internal case discussion/comments separate from the customer timeline | B | Planned |
| <a id="p-34"></a>P-34 | Professional | Keep external professional communication within the assigned work scope | F | Planned |
| <a id="p-35"></a>P-35 | Professional | Decide whether customer-professional communication is direct or routed through Atexgrove | F | Planned |
| <a id="s-73"></a>S-73 | Staff/admin | Allow scoped staff mentions/input requests without transferring full case ownership | F | Planned |
| <a id="s-74"></a>S-74 | Staff/admin | Break cases into specialist tasks/subtasks and track task ownership separately from the main assignee | F | Planned |
| <a id="v-40"></a>V-40 | Vendor/processor | Register external providers/firms separately from individual professionals | F | Planned |
| <a id="v-41"></a>V-41 | Vendor/processor | Track provider approval, suspension and inactive states | F | Planned |
| <a id="x-42"></a>X-42 | Compliance | Maintain a register of data processors/vendors, including future identity, email and payment providers | D | Planned |
| <a id="x-47"></a>X-47 | Compliance | Define and enforce permitted data-access scope for each processor/vendor | D | Planned |
| <a id="s-44"></a>S-44 | Staff/admin | Define staff permissions by action and scope rather than department membership alone | D | Planned |
| <a id="s-45"></a>S-45 | Staff/admin | Make exceptional elevated access temporary, approved and audited | D | Planned |
| <a id="s-46"></a>S-46 | Staff/admin | Periodically review active staff access and business need | D | Planned |
| <a id="s-48"></a>S-48 | Staff/admin | Require second-authorized approval for sensitive sharing or consequential overrides | D | Planned |
| <a id="s-49"></a>S-49 | Staff/admin | Record exceptional case overrides with reason, authority and audit history | D | Planned |
| <a id="s-50"></a>S-50 | Staff/admin | Track staff training/readiness for sensitive workflows | F — later, maybe | Planned; defer decision |
| <a id="p-50"></a>P-50 | Professional | Basic confidentiality acceptance before a professional review is attached to a case; final agreement terms require lawyer review | E — basic acceptance; D — final terms | Planned |
| <a id="x-51"></a>X-51 | Compliance | Define handling and deletion of professional copies/material after assignment ends | D | Planned |
| <a id="p-62"></a>P-62 | Professional | Allow view-only/no-download restrictions for selected assignments where feasible | D | Planned |
| <a id="x-53"></a>X-53 | Compliance | Classify cases and documents by confidentiality and handling requirements | F | Planned |
| <a id="p-54"></a>P-54 | Professional | Define customer-facing professional attribution by name, firm, credential and scope | F | Planned |
| <a id="p-55"></a>P-55 | Professional | Replace unavailable professionals while preserving history and transferring scope safely | F | Planned |
| <a id="s-56"></a>S-56 | Staff/admin | Show staff activity/history across handled and outstanding work | F | Planned |
| <a id="s-57"></a>S-57 | Staff/admin | Show management bottlenecks across teams/professionals and overdue work | F — later, maybe | Planned; defer decision |
| <a id="p-58"></a>P-58 | Professional | Track professional availability by service and location | F | Planned |
| <a id="p-59"></a>P-59 | Professional | Invite a named external professional to a scoped case without marketplace registration | F | Planned |
| <a id="p-60"></a>P-60 | Professional | End a professional relationship while preserving reviews, deliverables and audit history | F | Planned |
| <a id="p-63"></a>P-63 | Professional | Decide whether external professionals log in during Phase 3 or staff attach their reviews | Decision | Open |
| <a id="c-69"></a>C-69 | Customer | Guided case intake: listed-value council/area selectors, field-specific accessible errors and clear legacy location display | C | Done in PR #25; CI-verified in runs 39944706900 and 39944706867; UI-only, no hosted change |
| <a id="c-70"></a>C-70 | Customer | Apply approved design tokens and shared components repo-wide (auth pages, case pages, staff queue) | C | Planned |

### Delivery constraints

- New database tables must enable RLS and include explicit grants: `authenticated` **SELECT only**, `service_role` only as required, and **no `anon` grants**. Writes must use secured RPCs where appropriate.
- The customer-owned upload/download and staff/professional access paths must preserve scoped authorization and audit requirements.
- CI verification, implementation and hosted application are separate states. Never label a planned or local-only item as CI-verified or hosted.
- A new table requires explicit grants, authenticated SELECT only and no `anon` grant; writes use secured server/RPC paths.
- No external professional receives general case access: access is per assignment, limited to selected documents, time-limited, revocable and audited.
