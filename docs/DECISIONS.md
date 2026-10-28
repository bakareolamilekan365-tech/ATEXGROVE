# Decisions log

Format: decision, status, date, reason. Edit the reasons in your own words so you can defend each one.
Status values: Accepted / Accepted for pilot / Proposed (needs confirmation) / Deferred / Rejected.

| # | Decision | Status | Date | Reason (edit me) |
|---|----------|--------|------|------------------|
| 1 | Styling with Tailwind CSS | Accepted (not yet installed in code) | 2026-10-11 | Documented stack; it is optimal |
| 2 | 2D maps with MapLibre GL JS on PostGIS data | Accepted (later phase) | 2026-10-11 | Mapping foundation; it is optimal |
| 3 | Three.js / React Three Fiber for 3D | Deferred | 2026-10-11 | Needs terrain/building data and a working 2D GIS first |
| 4 | Blender | Not required now | 2026-10-11 | Three.js can build scenes directly; GLB/glTF can be loaded later |
| 5 | EasyUI (easyui.site, React/Tailwind) | Not adopted | 2026-10-11 | Evaluate individual components only; not the older jQuery EasyUI |
| 6 | CesiumJS, deck.gl, Giro3D, Babylon.js | Rejected for now | 2026-10-11 | No specific need |
| 7 | No real payments in the controlled pilot | Accepted | 2026-10-14 | The pilot may show a clearly labelled demonstration estimate, but it must not collect money, create a fake transaction or issue a fake receipt. |
| 8 | AI is advisory only | Accepted | 2026-10-11 | It must not invent approval status or authenticate documents (blueprint s.4, s.12) |
| 9 | `account_type` is not verification | Accepted | 2026-10-11 | A user choosing "professional" is a claim, not a verified fact |
| 10 | Demo data is always labelled | Accepted | 2026-10-11 | Prevents confusion with official data |
| 11 | Iterative, incremental SDLC | Proposed | 2026-10-11 | See SDLC.md |
| 12 | First controlled product is an Abuja/FCT verification-first case workflow before public land discovery | Accepted | 2026-10-14 | Prove a controlled evidence and review journey before expanding into marketplace or public map behavior. |
| 13 | Keep the existing repository; audit before rebuilding | Accepted | 2026-10-11 | Blueprint s.2 and s.32 |
| 14 | Use the six-stage pilot journey: request received, documents in, document checks, site and map, development options, report | Accepted for pilot | 2026-10-14 | The stages provide a comprehensible customer journey. They are requirements, not a claim that the workflow is implemented. |
| 15 | Support customer-created and authorized staff-assisted cases | Accepted | 2026-10-14 | Assisted creation must record the customer, staff actor, channel, consent and audit history; staff must not impersonate customers. |
| 16 | Use lead-controlled assignment with optional automated recommendations and assignee capacity acceptance | Accepted for pilot design | 2026-10-14 | Automation may recommend, but the lead remains accountable. An assignee may decline when overloaded and must provide a reason. |
| 17 | Consequential reports require two-person, discipline-appropriate review | Accepted | 2026-10-14 | Atexgrove performs the operational review; a qualified specialist reviews conclusions in their discipline. Official/statutory confirmation remains a separate authority level. |
| 18 | Limit the initial service to document intake, consistency checking, available professional review and separately labelled official-source evidence | Accepted | 2026-10-14 | The pilot must not promise comprehensive title, cadastral, planning or development verification that it cannot support. |
| 19 | Synthetic or redacted evidence first; real documents require a privacy/legal readiness gate | Accepted | 2026-10-14 | Real evidence must not be accepted until consent, terms, access, retention, deletion and incident processes are implemented and reviewed. |
| 20 | Do not use AI to process real pilot documents | Accepted | 2026-10-14 | Any early AI demonstration must use synthetic material, remain advisory and never create a verification decision. |
| 21 | Present trust as source, review state and authority level rather than one generic verified badge | Accepted | 2026-10-14 | This prevents internal review, professional opinion and official confirmation from being confused. |
| 22 | Use navy/blue as the primary interface palette with forest green, warm gold, ivory/light grey and charcoal as semantic/supporting colours; use Figtree for the application interface | Accepted for pilot | 2026-10-14 | Keeps the initial identity while following familiar professional-service interface conventions. Figtree is the family referenced by both approved dashboard mockups. |
| 23 | Use in-app notifications plus email for important pilot events | Accepted for pilot | 2026-10-14 | Email must avoid sensitive evidence details and direct the user back to the authenticated application. SMS/WhatsApp remain future options. |
| 24 | Keep platform role, staff permission and verification status separate | Accepted | 2026-10-20 | A customer-selected role does not grant staff access or prove a trust/verification state; each boundary needs its own authorized workflow. |
| 25 | Show customers a standard status for every case state change, never internal notes or staff names | Accepted | 2026-10-20 | Customer communication must be predictable and safe while internal operational reasoning and staff identity remain in the restricted workspace. |
| 26 | Treat evidence as immutable and replace it only with a superseding version | Accepted | 2026-10-20 | Important evidence must retain its original object, metadata and lineage rather than being silently overwritten. |
| 27 | Allow staff evidence downloads only through an audited authorization function | Accepted | 2026-10-20 | Direct staff object reads would bypass the required access decision and audit record. |
| 28 | Only the server-side admin client may sign evidence downloads or clean up failed uploads | Accepted | 2026-10-20 | The service-role credential is a narrow server-only capability and must never be exposed to browser code or used as a general authorization shortcut. |
| 29 | Stay on Supabase Postgres with SQL migrations, RLS and pgTAP; do not adopt Prisma | Accepted | 2026-10-21 | Preserve the database security model and migration/test workflow already established. |
| 30 | Preserve the existing architecture, staff model, evidence storage and audit patterns | Accepted | 2026-10-21 | New work should extend the reviewed foundations rather than introduce a parallel model. |
| 31 | Start the Development Control module only after the Slice 2 fixes and Slice 3 | Accepted | 2026-10-21 | Finish and stabilize the current delivery sequence before starting the second module. |
| 32 | Target company registration by December 2026 and the first demo in January 2027 | Accepted target | 2026-10-21 | These are planning targets, not claims of completion or launch readiness. |
| 33 | Take payments later through a licensed provider such as Paystack or Flutterwave | Deferred | 2026-10-21 | No payments now. Payment work starts only after company registration and Terms, refund and privacy policies are ready. |
| 34 | Require client consent before sharing any data with outside professionals | Accepted | 2026-10-21 | External professional access must be deliberate, disclosed and authorized by the client. |
| 35 | Use in-app notices only for now; do not integrate an email provider yet | Accepted for current phase | 2026-10-21 | This supersedes the email portion of decision 23 until an email provider is selected and approved. |
| 36 | Revisit a repo-wide palette change to blue later | Undecided | 2026-10-21 | Do not perform a repo-wide palette change until the owner confirms the direction. |
| 37 | Keep a static typed list of the six FCT area councils, with starter areas labelled "demo, not official" | Accepted for planning | 2026-10-21 | The councils are AMAC, Bwari, Gwagwalada, Kuje, Kwali and Abaji; the owner will confirm the starter-area content later. |
| 38 | Idle session timeout policy | Open / undecided | 2026-10-22 | No idle timeout exists today. The Supabase session persists in its browser cookie until it expires or the user signs out; decide whether and when an idle timeout is appropriate. |
| 39 | Use Netlify Free plus a separate Supabase Free staging project for the private preview | Accepted | 2026-10-27 | Keep the preview isolated from the existing hosted project and within the strict ₦0 / $0 budget; GitHub remains source/CI and Google Forms/Sheets handle requests and feedback. |
| 40 | Target a closed preview for 12–20 November 2026 with about 15–20 approved owners/board members | Accepted target | 2026-10-27 | Use fictional data and individual accounts; the distributed access-request form does not mean staging or account provisioning is complete. Readiness gates may move the date. |
| 41 | Keep November on existing email/password and dual-role permissions; defer staff identity redesign to January 2027 | Accepted | 2026-10-27 | Staff ID/password, possible authenticator MFA, separate staff/customer identities, employee customer-access controls and conflict safeguards are not November acceptance requirements. |
| 42 | Treat the updated staff dashboard PDF as a Verification Lead design reference, not implementation evidence | Accepted | 2026-10-27 | November UI may adopt its styling while showing only implemented functions. Handovers, second review, workload/capacity, Staff ID login and authenticator status remain planned. |
| 43 | Use authenticated direct browser-to-Supabase evidence uploads for the November private preview; defer durable upload reservations and automated orphan cleanup until after the preview | Accepted for November preview | 2026-10-27 | Netlify Free cannot reliably proxy the permitted 9–10 MiB evidence files through buffered functions. Migration 026 already restricts Storage INSERTs to the owning customer and eligible case states, while `register_case_evidence` independently validates the stored object and registration metadata. Browser-direct upload removes the hosting payload bottleneck with no schema change. The preview accepts possible private unregistered orphan objects and weaker pre-registration quota concurrency for the small synthetic-data cohort; these limitations must be documented and revisited after the preview. |

| 44 | Provide Light, Dark and System presentation modes in the approved shared header | Accepted | 2026-10-28 | A single CSS-variable theme system preserves the approved Atexgrove layout, stores only the display preference, follows the operating system in System mode and initializes before hydration to reduce incorrect-theme flashing. It does not alter authentication or authorization. |

## Notes
- The original PRD and UI/UX spec in docs/ were generated by GPT and are being revised. They are not authoritative until reviewed.
- Decided 2026-10-11: product name Atexgrove (code identifier `atexgrove`); repository rename pending.
- Decided 2026-10-14: pilot palette and Figtree interface font were accepted; the logo portion of that decision is superseded below.
- Decided 2026-10-21: the owner confirmed `assets/brand/source/atexgrove-*.jpg` as the final logo source. A true vector or transparent PNG is required before the logo is used in the application header or favicon.
- Decision 43 requires server-side validation of the stored object's signature before registration. It adds no migration 027. A deployed 9–10 MiB staging upload remains a mandatory acceptance gate; authenticated standard upload is the November implementation, with TUS as the reviewed fallback if staging proves it unreliable. Durable reservation/expiry architecture is deferred, not rejected.

## Evidence submission and migration naming — 2026-10-25 (PR #29)

- Customers deliberately add or replace documents only in `draft` or `needs_customer_info`. After submission they must wait for a staff information request; `submitted`, `assigned` and `in_review` do not allow uploads or customer corrections.
- Each newly registered file is pending (`submitted_at IS NULL`) and invisible to staff through metadata, counts, joins, audit reads and downloads until explicit customer submission. Previously submitted versions remain accessible to authorized staff. Submission is not professional review or authentication.
- Staff cannot resume `needs_customer_info` as `in_review`. Only the customer's explicit reply releases pending files and resumes review in one transaction. Staff may close or cancel; the customer may cancel. Terminal actions never release pending files.
- Atexgrove migration filenames use one three-digit sequential version: `025_case_timeline_evidence_workflow.sql`, `026_pending_evidence_submission.sql`, and so on. Because the Supabase CLI generates timestamp names, create the migration with the CLI and rename it to the next reviewed sequential version before it is committed, tested or applied anywhere. On 2026-10-25 the hosted history marker for already-applied migration 025 was normalized from its generated timestamp to `025`; no migration SQL was rerun. Migration 026 was subsequently applied according to owner confirmation; the last independent ledger check remains the earlier 025 observation.


## Open owner decisions — 2026-10-21

- Confirm the authoritative Development Control requirements source and contact.
- Identify any outside professional partners.
- Confirm the service list.

## Real-document readiness gate

The controlled pilot begins with synthetic or properly redacted evidence. Before Atexgrove accepts real client documents, the responsible team must implement and obtain appropriate Nigerian legal/privacy review of, at minimum:

- a clear Privacy Notice and Terms of Service;
- explicit pilot participation and document-processing consent, with evidence of the version accepted;
- a cookie notice and consent choice for any non-essential cookies (essential authentication/security cookies should still be disclosed);
- document access, retention, deletion and backup-handling rules;
- complaints/support and data-subject request procedures;
- internal least-privilege access, incident response and processor/vendor controls; and
- clear verification, professional-reliance and authority-boundary disclaimers.

These are launch gates, not claims that legal compliance is already complete. Draft product copy must receive appropriate professional review before real evidence is collected.
