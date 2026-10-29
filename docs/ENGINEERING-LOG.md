# Atexgrove Engineering Log

This log records significant engineering problems, their causes, the corrections made, and the lesson carried into later work. It is written to help future contributors understand why safeguards exist.

Do not add secrets, access tokens, private customer information, email addresses, or user IDs to this log.

## 2026-10-29 — PR #33 profile and presentation follow-up

**Problem:** The account initial/name did not open a profile, shared Settings routes were placeholders, and the editable profile form hid load failures and could report success after a zero-row update. The header theme control was bulky, draft/cancelled progress was misleading, and auth pages carried the full site navigation.

**Cause:** The first UI alignment concentrated on static visual structure; account navigation, confirmed write results and workflow-aware progress had not been connected to the existing authenticated data.

**Fix:** Add customer/staff Profile and Settings routes, an avatar/name link, read-only staff role display, confirmed owner-scoped profile saves, compact theme toggle plus full settings choices, and progress derived from supported states and visible events. Center auth cards, add password visibility, expand the public page with project-owned/illustrative imagery and honest information placeholders, and add accessible loading/error recovery. No database or hosted changes.

**Lesson:** A visual control must lead to a working authorized path; a saved profile is not confirmed until the owner-scoped update returns a row. Contact fallback and handover milestones remain backend work, not mock UI state.

**Verification:** Local lint, typecheck, 108 unit tests, 41 integration tests (3 existing skips), guardrails and production build passed. Four public/auth Playwright checks passed after the public information route was added to the middleware allowlist. Authenticated customer/staff browser acceptance remains open. CI results for the final PR head belong in PR #33.

## 2026-10-28 — Approved references contained more functionality than the product

**Problem:** The customer and staff reference dashboards establish a strong visual direction but also contain names, records, due dates, notifications, handovers, second review, capacity and identity concepts that are not all implemented.

**Cause:** A visual design artifact combines presentation examples and future product ideas; treating every visible element as a requirement would create fake data and bypass the repository's current scope and permission boundaries.

**Correction:** The UI alignment uses the current customer v2 and Verification Lead references only for layout, typography, colour, cards and responsive hierarchy. Shared headers, dedicated account-access routes, auth cards, workflow progress and staff queue groupings consume real repository records and existing statuses. Closed and Cancelled are separate, each dashboard group is capped at five before a filtered list, and authenticated customer Help/Profile pages remain in the customer context. Mock-only functionality remains absent. `NEXT_PUBLIC_PRIVATE_PREVIEW` affects presentation only, and the existing Supabase authentication, RLS, server actions and evidence upload behavior remain unchanged. A persistent Light/Dark/System control uses CSS variables and an early theme initializer rather than a second layout system.

**Verification:** Lint, typecheck, 105 unit tests, 40 integration tests (3 environment-dependent skips), security guardrails and the production build passed. Local Chrome review covered the public/auth surfaces at 1280px and 390px, light/dark presentation, preview registration gating, mobile overflow, theme refresh persistence and System-mode changes. Final GitHub CI and authenticated customer/staff browser review remain to be recorded before merge.

**Lesson:** References guide visual decisions; `DECISIONS.md`, implementation and `STATUS.md` still determine accepted behavior, real capabilities and verification state.

## 2026-10-12 — Supabase-owned objects broke fresh-stack migrations

Related work: [PR #9](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/9)

**Problem:** The database-security workflow failed during `supabase start`, before pgTAP tests could run. Migration `015_foundation_security_hardening.sql` created triggers on `storage.objects`, and an early version of migration `017_advisor_fixes.sql` attempted to enable RLS on `public.spatial_ref_sys`.

**Cause:** Both tables are managed by platform components rather than the application migration role. `storage.objects` belongs to Supabase Storage, and `spatial_ref_sys` belongs to the Supabase/PostGIS service boundary. The migration role was not the owner and could not safely alter them.

**Fix:** Removed the custom triggers from `storage.objects` and removed the `spatial_ref_sys` RLS block. The user-scoped Storage policies were retained because application policies on `storage.objects` are supported. Document-access audit events were moved to the application-controlled workflow.

**Lesson:** Run every migration from the beginning on a fresh CI Supabase stack before applying it to the hosted project. Do not alter objects owned by Supabase services or PostGIS extensions merely to silence an advisor warning.

## 2026-10-12 — Organization administrators could modify owner memberships

Related work: [PR #9](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/9)

**Problem:** An organization administrator could demote or remove an organization owner.

**Cause:** The earlier membership policy allowed owners and administrators to manage membership rows but did not adequately distinguish an existing owner row from an ordinary member row. A policy-presence check could not reveal this behavioral gap.

**Fix:** Added migration `016_membership_owner_protection.sql` and behavioral allow/deny tests covering owner, administrator, member, outsider, anonymous, and last-owner cases.

**Lesson:** A test proving that a policy exists is not a test proving that the policy permits and denies the correct behavior. Authorization tests must exercise realistic identities and verify the resulting rows.

## 2026-10-12 — Authentication callback accepted unsafe redirect destinations

Related work: [PR #9](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/9)

**Problem:** The authentication callback could accept a crafted return path that sent a user outside Atexgrove.

**Cause:** Redirect input was treated as a path without fully rejecting external URLs, protocol-relative URLs, backslashes, or control-character browser parsing tricks.

**Fix:** Added `safeInternalPath`, restricted redirects to same-application relative paths, and added unit tests for valid paths and bypass attempts.

**Lesson:** Treat every redirect destination as untrusted input. Validate the parsed destination and test browser edge cases rather than relying on a prefix check alone.

## 2026-10-16 — Anonymous users retained execute permission on an authorization helper

Related work: [PR #13](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/13)

**Problem:** `public.organization_actor_role(uuid)` remained callable by `anon` after execution was revoked from `public`.

**Cause:** Supabase had granted `EXECUTE` directly to the `anon` role. Revoking the inherited `PUBLIC` grant did not remove that explicit role grant.

**Fix:** Migration `018_verification_case_slice_1.sql` explicitly revoked execution from both `public` and `anon`. The database tests use `has_function_privilege` to verify the effective permission.

**Lesson:** Inspect effective privileges on the live project. Do not assume that revoking from `PUBLIC` also removes grants assigned directly to `anon` or `authenticated`.

## 2026-10-20 — Documentation drifted from the deployed and tested state

Related work: [PR #18](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/18)

**Problem:** Different documents made conflicting claims about deployed migrations, pgTAP results, implemented slices, and outstanding verification.

**Cause:** Dated audit sections and implementation documents were updated at different times, so historical statements were sometimes read as the current state.

**Fix:** Added `docs/STATUS.md` as the single source of truth for the current hosted state, implemented product slices, automated evidence, accepted advisor findings, and remaining gaps. Historical audit entries remain historical.

**Lesson:** Keep one clearly identified current-status document. Update it from evidence after changes pass; do not rewrite history or infer deployment from the presence of migration files.

## 2026-10-19 to 2026-10-20 — A dual-role account saw staff-only case notes

Related work: [PR #15](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/15) and [PR #17](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/17)

**Problem:** A customer-facing case page showed staff-only notes when the same account was both the customer and a staff member.

**Cause:** The page relied on RLS to return every row the signed-in account was allowed to read. RLS correctly recognized the staff permission, but the customer-facing screen required a narrower context than the account's combined permissions.

**Fix:** Added explicit customer-only filters in PR #15 and completed the separation of customer and staff case contexts in PR #17. Staff tools now have a distinct workspace and customer pages request only customer-safe records.

**Lesson:** RLS establishes the maximum data boundary; it does not decide what belongs on a particular screen. UI queries must filter for their explicit context, and authorization tests must include accounts with more than one role.

## 2026-10-20 — Hiding internal notes also hid useful customer status

Related work: [PR #17](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/17)

**Problem:** Internal notes originally defaulted to customer-visible. Changing the default to private prevented leakage, but it also left customers without a reliable status explanation.

**Cause:** One event was being used for two audiences: a safe customer timeline and detailed internal staff reasoning.

**Fix:** Migration `020_case_context_separation.sql` always writes a fixed customer-safe status event and separately stores a private staff note. Staff may provide an optional customer message without exposing the internal note.

**Lesson:** Different audiences need separate records or fields. A secure default must not make the product silent; provide a deliberately safe customer-facing event instead of reusing internal commentary.

## 2026-10-20 — Direct Storage reads bypassed evidence-download auditing

Related work: [PR #16](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/16)

**Problem:** The first version of the private-evidence slice allowed staff to read Storage objects directly, bypassing the required access-audit path.

**Cause:** A Storage SELECT policy granted convenient object access alongside the audited download authorization function. Either path worked, so the audit step was not mandatory.

**Fix:** Removed the authenticated Storage read policy. Staff downloads now pass through the audited authorization RPC, followed by a server-only admin client that creates a short-lived signed URL. Upload validation also checks the file signature, and the admin client was isolated in a server-only module.

**Lesson:** A security control is not effective when a second, easier path bypasses it. Sensitive access should have one enforced route, and privileged credentials must stay inside server-only code.

## 2026-10-20 — Database tests assumed the wrong RLS failure behavior

Related work: [PR #16](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/16)

**Problem:** CI tests referenced Storage policy names that had been removed and expected an unauthorized SQL `UPDATE` to throw an error.

**Cause:** The assertions were not updated with the security design. PostgreSQL RLS can hide unauthorized rows from an `UPDATE`, producing zero updated rows rather than an exception.

**Fix:** Updated the policy assertions to match the intended policy set. Behavioral tests now perform the unauthorized update and verify that the protected row remains unchanged.

**Lesson:** Test the security outcome, not one assumed error shape. For RLS-protected updates, unchanged data can be the correct denial signal.

## 2026-10-19 to 2026-10-20 — Local development environment failures obscured application status

**Problem:** Local development encountered Google Fonts timeouts, stale `.next` cache chunk errors, a branch without an upstream, and missing packages after dependency changes.

**Cause:** The application depended on a build-time external font request; generated Next.js output became stale; the local Git branch was not tracking its remote branch; and the installed packages no longer matched the lockfile.

**Fix:** Replaced Google-hosted Figtree with a self-hosted font. Cleared the stale `.next` output before rebuilding. Set the branch upstream before normal push/pull work. Ran `npm install` after dependency changes so the local installation matched the committed lockfile.

**Lesson:** Prefer deterministic local assets for build-critical resources. Treat generated caches as disposable, configure branch tracking when a branch is created, and synchronize dependencies whenever the package manifest or lockfile changes.

## 2026-10-21 — Refreshing a submitted case could create duplicates

Related work: [PR #21](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/21)

**Problem:** Replaying the new-case form submission after its redirect could create another verification case. Reusing a key with different request details also needed an explicit rejection rule.

**Cause:** Case creation had no customer-scoped idempotency key or database constraint to recognize a retried submission.

**Fix:** Migration `021_case_creation_idempotency_and_response_event.sql` adds a unique customer/key index. The creation RPC returns the existing case only when the normalized request matches; materially different request data with the same key is rejected. pgTAP verifies matching replay, conflicting replay, and that the original case remains unchanged. Migration 021 was applied to hosted Supabase on 2026-10-21.

**Lesson:** Make retries safe at the database boundary, and bind an idempotency key to the original request rather than silently treating every reuse as a replay.

## 2026-10-21 — Customer replies were not distinct from timeline messages

Related work: [PR #21](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/21)

**Problem:** A customer response to an information request was stored and labelled like an ordinary customer message, making its purpose unclear in the case timeline.

**Cause:** Timeline events had no explicit event kind, so their display depended on text and status fields that represented different actions.

**Fix:** Migration `021` adds a constrained `event_kind` and classifies historical events. Customer responses now include a fixed customer-safe status line plus a separate response event; staff-only notes remain hidden from customers. The behavior is covered by pgTAP and application tests. Migration 021 was applied to hosted Supabase on 2026-10-21.

**Lesson:** Give events explicit meaning and audience. Do not infer the kind of interaction from free-form text, and test both customer-visible and staff-only views.

## 2026-10-22 — Assignment notes, location input and session exit need explicit safeguards

Related work: migration 022 and sign-out changes in `fix/assignment-events-location-and-contact` (PR #24).

**Problem:** Assignment notes could be shown directly to customers, the case form did not constrain council and area input to its structured choices, contact phone details had no explicit consent boundary, and the application had no visible sign-out control.

**Cause:** The original assignment action exposed an optional visibility toggle; location and contact fields were not structured; and the app relied on cookie expiry without an explicit user action to end the session.

**Fix:** Migration 022 is implemented on this branch to write a fixed customer-safe assignment event plus a private staff note, add council/area/address and consented phone fields, and keep phone values out of events and audit metadata. A POST server action signs out the local Supabase session and redirects to login; protected responses use `private, no-store`. New tests and documentation cover the flow. CI run 39909627609 and database-security run 39909627678 passed; migration 022 is not hosted. No idle timeout is implemented; its policy remains undecided.

### PR #24 follow-up — legacy location, preflight and assignment conflict checks (updated 2026-10-23)

**Problem:** A legacy `Kwali LGA` value could conflict with migration 022's new area-council constraint, and the assignment RPC did not prevent a case customer from being assigned their own case or acting as the assigning lead. The UI also needed explicit null fallbacks for newly added location columns on older rows.

**Cause:** The constraint was introduced without normalizing the known legacy value first; assignment authorization checked department-lead scope and assignee activity, but not customer/assignee conflicts.

**Fix:** Normalize only `Kwali LGA` to `Kwali`, then preflight all remaining distinct council values before adding the `NOT VALID` constraint. Any unrecognized value aborts with its row count and requires a reviewed migration or manual correction; no mapping is guessed. Reject both assignment conflict cases and cover them with pgTAP allow/deny assertions. Add a unit guard comparing SQL and TypeScript starter-area lists, retain null-safe detail-page fallbacks, correct backlog tiers, and update status/test-count documentation. CI run 39909627609 passed application checks; database-security run 39909627678 passed all six pgTAP suites (191 assertions). Migration 022 remains not hosted pending review.

**Lesson:** Even `NOT VALID` checks constrain later updates to old rows. Normalize known legacy values before adding them, and test conflict-of-interest rules at the database boundary.

**Lesson:** Separate audiences in the data model, validate structured fields at both application and database boundaries, keep contact details out of audit/event text, and provide an explicit session-exit path without suggesting an unapproved timeout policy.

**CI evidence (2026-10-23):** CI run 39909627609 passed 36 unit tests, 14 integration tests (3 skipped), lint, typecheck, security guardrails and production build. Database security run 39909627678 passed all six pgTAP suites (191 assertions) on a disposable Supabase stack. This verifies the branch in CI only; migration 022 has not been applied to the hosted project.

## 2026-10-23 — Case form accepted arbitrary locations and exposed raw validation errors

Related work: [PR #25](https://github.com/bakareolamilekan365-tech/ATEXGROVE/pull/25) (`fix/case-form-ux`; UI/tests/docs only).

**Problem:** The council and listed-area controls accepted arbitrary text, form errors could expose raw schema messages, and legacy cases with no detailed area could look as if their location were missing rather than simply not recorded. Customer-entered area text remains available only through the explicit “My area isn't listed” choice.

**Cause:** Browser datalists suggest values but do not constrain submissions; error rendering used the first schema issue directly; and location headings treated a null area as a literal missing value.

**Fix:** Add a shared keyboard-accessible select that submits only listed values, friendly per-field errors with associated help text and first-invalid focus, preserve entered values on failure, and show council-only headings with an explicit legacy note. Address guidance now enforces a 10-character application minimum while retaining the existing 3-character database constraint. UI tests and documentation are added. CI run 39944706900 passed lint, typecheck, 39 unit tests, 14 integration tests (3 skipped), security guardrails and production build; database run 39944706867 passed 6 pgTAP suites (191 assertions) on disposable Supabase. The change has no migrations or hosted schema effects.

**Lesson:** Suggestions are not validation. Constrain values at the control and server boundary, keep errors understandable, and distinguish legacy absence from invalid data.

## 2026-10-23 — Draft-first uploads and customer cancellation

**Problem:** Customers could attach evidence only after submitting a case, and they had no customer-controlled way to discard a draft or cancel an open request.

**Cause:** Case creation immediately entered the staff-visible workflow, while evidence eligibility and the Storage insert policy excluded the existing `draft` status.

**Fix:** Migration 023 creates new cases as private drafts with idempotent request keys and no initial customer-visible event; adds owner-only submit, discard and open-case cancellation RPCs; permits draft evidence under existing size/type/signature/path/quota rules; and excludes active drafts plus discarded-draft history from staff RLS and audited downloads. The customer UI supports draft continuation, optional uploads, submission, discard and cancellation. CI run [39948240236](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39948240236) passed 40 unit tests and 17 integration tests (3 skipped), lint, typecheck, guardrails and build; database run [39948240244](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39948240244) passed all seven pgTAP suites (238 assertions) on a disposable Supabase stack. Migration 023 is not hosted.

## 2026-10-23 — Hosted migration 022 and structured discarded-draft authorization

**Problem:** Current-state documentation still described hosted migration history as `001`–`021`, although migration 022 was applied to hosted Supabase on 2026-10-23. Separately, migration 023's staff authorization inferred a discarded draft by matching the customer-facing event reason, coupling permissions to presentation text that could be changed.

**Cause:** Deployment status was not propagated across the docs after the hosted apply, and discarded-draft state had no dedicated database field.

**Fix:** Record hosted state as `001`–`022` (022 applied 2026-10-23) while keeping 023 CI-verified, not hosted. Migration 023 adds nullable `verification_cases.discarded_at`: only `discard_draft_case` sets it; new drafts, submissions and ordinary customer cancellations leave it null. Staff access checks this structured marker rather than event text. Tests cover active and discarded draft isolation from leads and other staff, denied evidence downloads, owner-only cancellation/discard, and continued staff visibility of an ordinarily cancelled case. Discarded draft rows and files remain retained pending a separate retention/deletion decision.

**Lesson:** Keep hosted deployment facts separate from CI results, and make authorization depend on structured state—not user-facing event copy.

**CI evidence for this update:** App run [39950544017](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39950544017) passed lint, typecheck, 40 unit tests, 17 integration tests (3 skipped), security guardrails and production build. Database run [39950544756](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39950544756) passed seven pgTAP suites (250 assertions) in a disposable Supabase environment. Migration 023 remains not hosted.

**Lesson:** A draft is a privacy boundary, not just a label. Apply visibility consistently to case rows, events, evidence metadata, Storage objects and privileged download paths. Retain uploaded files until a reviewed retention policy exists.

## 2026-10-23 — Case intake claims, human references and service-scope consent

**Problem:** Intake did not capture why a customer was requesting review, the customer's claimed relationship to land, who the request was for, or acceptance of the service boundary. Customers and staff also had only opaque UUIDs, no customer-facing next-action cue, and a generic evidence upload control.

**Cause:** The draft-first workflow was intentionally minimal and had no versioned consent record, submission-time public reference, or structured intake claim fields.

**Fix:** Migration 024 adds nullable legacy-safe claim fields, validates representation and authority for new requests, allocates a unique human-readable case number only at submission and backfills existing submitted-or-later cases in creation order. A private case-scope consent table has RLS and SELECT-only client access; the SECURITY DEFINER submit RPC records consent and accepts only the current notice version. The current notice is explicitly draft wording, not legally reviewed. The app adds claim labels, action-needed guidance and a five-category evidence checklist. App run [39954573306](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39954573306) passed lint, typecheck, 45 unit tests, 19 integration tests (3 skipped), guardrails and build. Database run [39954573310](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39954573310) passed eight pgTAP suites (287 assertions). Migration 024 is CI-verified, not hosted.

**Hosted baseline note (recorded 2026-10-23):** The owner confirms migration 023 was applied after PR #26 merged; hosted history is `001`–`023`. Earlier dated “023 not hosted” notes remain historical snapshots of the state at the time they were written.

**Lesson:** Treat customer statements as claims, not evidence. Record consent at the transaction boundary that commits the request, allocate references only when the request becomes active, and retain nulls rather than inventing historical intake data.

## 2026-10-23 — Annual case numbering and draft wording correction

**Problem:** The first case-number implementation used a global sequence while embedding the year in each reference, so serials did not restart annually and the global capacity error was misleading. Draft cards/details also said “Received” before submission, and the RPC accepted the contradiction of “representing someone” while the request was for “myself.”

**Cause:** A sequence has one global state and was formatted with a year that did not scope its allocation; shared copy did not distinguish a private saved draft from a submitted request; representation validation checked each field separately.

**Fix:** Replace the sequence in unhosted migration 024 with an RLS-enabled counter table keyed by Africa/Lagos calendar year, with no Data API role grants or policies. The submit RPC increments a year row using a transactional `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`, serializing concurrent submissions for that year. Backfill submitted-or-later cases in deterministic `created_at,id` order within each Africa/Lagos year, excluding owner-discarded drafts; new drafts remain unnumbered and retries preserve their number. Reject `representing_someone` plus `self` in Zod and the create RPC. Label drafts “Saved” on the dashboard and “Draft” on details, and describe creation failures as saving a draft. Document the controlled maintenance window for migration 024's incompatible RPC signatures. Migration 024 remains unhosted; follow-up checks are on PR #27.

**Lesson:** A year in an identifier must also scope its allocator. Keep display language aligned with workflow state, and enforce clear contradictions at both validation boundaries.

## 2026-10-23 — Hosted migration ledger reconciliation

**Problem:** Current documentation still described the hosted database at migration 023 and migration 024 as not hosted.

**Cause:** The repository records and earlier owner confirmations were not refreshed after migration 024 was applied.

**Fix:** A read-only `supabase migration list --linked` check on 2026-10-23 showed migrations `001`–`024` on the linked hosted project. The ledger does not show the exact apply date for 024. Current-state documentation was updated; earlier dated notes that accurately said 024 was not hosted remain as history.

**Lesson:** Re-check the live migration ledger when recording deployment state, and distinguish that observation from CI evidence or the migration's exact deployment date.

## 2026-10-23 — Case timeline and evidence version workflow (migration 025 proposed)

**Problem:** Staff saw a historical draft-upload event headed “Draft — not submitted” after the case was submitted. Customer replies appeared as two response-kind milestones. Replacement choices did not distinguish a separate file from a new version, and an older version could be selected. An upload registration error was reduced to a generic message without a safe server diagnostic.

**Cause:** `register_case_evidence` wrote an unchanged workflow status as `status_change`; the old response RPC gave the fixed transition line and the actual reply the same kind; and the replacement RPC incremented from any predecessor without verifying it was the current leaf. The exact manual registration failure could not be reproduced from the report and was not logged by the old action; the existing form also offered cross-type predecessor choices that the RPC rejects.

**Fix:** Proposed migration 025 adds `document_uploaded`, classifies new uploads as activity, writes the fixed customer-safe reply transition and actual reply as distinct ordered event kinds, and guards a linear replacement chain with a same-case/type/current-leaf check plus a unique successor index. The UI explicitly chooses New document or Replacement version and only offers latest same-type versions. Timeline headings classify legacy upload/reply events at render time without editing their stored history. The server action now logs sanitized failure codes/messages, maps known failure categories to safe customer copy, and attempts Storage cleanup after failed registration. Staff intake values use centralized readable labels. App run [39974685742](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39974685742) passed lint, typecheck, 53 unit tests, 23 integration tests (3 skipped), guardrails and production build; database run [39974685721](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39974685721) passed all 8 pgTAP suites (323 assertions). Migration 025 is CI-verified, not hosted.

**Lesson:** Preserve event history but present it by meaning. Keep version replacement linear at both the UI and database boundaries, and log enough sanitized diagnostics to investigate a failure without disclosing storage paths or customer filenames.

## 2026-10-25 — Upload preparation was visible before explicit submission

**Problem/root cause:** 025 corrected the event kind but still wrote one upload event per file. Metadata RLS and the audited download RPC authorized staff by case scope alone. There was no durable per-evidence release boundary; new evidence on an awaiting-information case was immediately visible. Customer response also wrote two visible rows for one submission.

**Correction:** Forward-only migration 026 adds per-file submitted time/event, keeps new registrations pending with creation audits only, and enforces submitted state in metadata RLS and audited downloads. Explicit owner request/response submission releases all pending files in the same locked transaction as its single milestone and audit. A request-event reference plus uniqueness guard makes retries safe across later rounds. Previously visible evidence is grandfathered; draft/discarded evidence remains private. Prior migrations/events/audits are unchanged. The response RPC now requires a request token; explanation remains mandatory.

**Presentation:** Separate document history shows versions, predecessors, dates and pending/submitted labels. Timeline filters upload activity and unambiguous old fixed response companions without deleting history. Staff notes retain their existing visibility boundary.

**Verification/deployment:** Hosted ledger read-only confirmed through migration 025. New app and pgTAP regression coverage exercises authenticated owner, lead, assigned staff, unrelated customers and out-of-scope staff. Final CI evidence is recorded in PR #29 and STATUS. Docker is unavailable locally; database checks use disposable GitHub Actions. Migration 026 is not hosted. This work does not merge, deploy or change hosted data.

**Lesson:** Saving a file and submitting it for review are different operations. Enforce that distinction in database reads and download authorization, not only in timeline text or buttons.

**Verified code commit `18cc17b99469ba2915b51a301dccc0aff4c7b7e2`:** [App CI 40176136069](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40176136069) passed lint, typecheck, 70 unit tests, 26 integration tests (3 existing credential-gated skips), security guardrails and production build. [Database CI 40176136055](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40176136055) passed all nine regular pgTAP suites (436 assertions), then reset its disposable LOCAL database to 025, seeded historical fixtures, applied the real 026 file and passed 13 upgrade assertions: **449 database assertions total**. Tests exercise authenticated owners, leads, assignees, scoped application admins and out-of-scope users. Local Playwright completed with four existing placeholder tests skipped; this is not full browser acceptance evidence. No hosted migration, merge or deployment was performed.


## 2026-10-25 — PR #29 follow-up: explicit category and customer-only review resumption

**Request:** Apply the owner's focused review patch in PR #29, including documentation in the same PR; do not edit applied migrations 001–025 or apply 026 to hosted Supabase.

**Changes:** The generic evidence form starts with an empty required category and resets replacement state when cleared. A checklist's explicit category remains selected. Migration 026 and the shared transition table reject staff `needs_customer_info -> in_review`; staff may close/cancel while only an explicit customer response releases pending files and resumes review. Staff UI explains the boundary and offers no resume option. Tests cover the rendered controls, rejected staff resume, subsequent successful customer release, no pending files stranded in review, and terminal preservation. Decisions, known issues and runbook now record upload windows, pending privacy, legacy presentation heuristics, migration naming and merge → migration → new-app cutover with read-only post-apply queries. Earlier log entries remain historical.

**Local verification before publishing:** lint, typecheck, 75 unit tests, 26 integration tests (3 existing credential-gated skips), security guardrails and production build passed. All 10 pgTAP suites passed 494 assertions on disposable native PostgreSQL 16.15 initialized with upstream Supabase Auth/Storage schemas and the Storage delete guard; the actual 025 → 026 upgrade passed 13 further assertions (507 total). This local SQL harness is not a full Supabase service-stack test; the new full-stack CI verification is recorded below. Earlier CI results above describe prior revisions. Migration 026 remains **not hosted**. No merge, deployment or hosted mutation performed.


**Verified follow-up revision `29d31036b2a4a8208bafbc8cfc7cc4a5083d4def`:** [App CI 40194071878](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40194071878) passed lint, typecheck, **75 unit tests**, **26 integration tests** (3 existing credential-gated skips), security guardrails and production build. [Database CI 40194071685](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40194071685) passed **10 pgTAP suites / 494 assertions** on the full disposable Supabase stack and **13 actual 025 → 026 upgrade assertions**, **507 database assertions total**. Authenticated owner/assignee tests exhaust every staff destination while evidence is pending, reject resumption, preserve terminal privacy and prove customer replies release files before review resumes. Migration 026 remains **not hosted**; migrations 001–025 are unchanged. No merge, deployment or hosted migration was performed.

## 2026-10-25 — Migration versions 025 and 026 normalized

**Problem:** Migrations 001–024 used short sequential filenames, while migrations 025 and 026 used CLI-generated timestamp versions. The mixed naming made the project sequence harder to read and caused documentation to alternate between two identifiers for the same migration.

**Cause:** `supabase migration new` correctly generated timestamp filenames, but this repository's established convention was not restored before migration 025 was applied.

**Fix:** Rename the two files to `025_case_timeline_evidence_workflow.sql` and `026_pending_evidence_submission.sql` without changing their SQL. After confirming migration 025's schema objects existed, add history marker `025`, verify both markers, then remove the former timestamp marker. A read-only ledger check now shows local/remote agreement for `001`–`025`, with only 026 pending. The dry run lists only `026_pending_evidence_submission.sql`; it was not applied.

**Lesson:** In this repository, generate new migrations with the CLI, then rename them to the next reviewed three-digit version before committing, testing or applying them. Never rename an applied migration without a controlled ledger repair and verification.

## 2026-10-27 — Login succeeded but authenticated navigation required a refresh

**Reported symptom:** After a correct email/password sign-in, the login screen could remain visible until a manual browser refresh. Similar stale-session behavior was reported when crossing between the customer dashboard and staff workspace.

**Investigation:** The client completed `signInWithPassword`, then started `router.push("/dashboard")` and immediately called `router.refresh()`. In the Next.js App Router these are separate client operations; the refresh can act on the current route while navigation is pending, and client-cached server-component data can survive an authentication-boundary change. The middleware validated the session server-side, but redirects created after a Supabase token refresh did not copy refreshed cookies and cache headers from the middleware response. A manual reload succeeding is consistent with these two code paths. No safe staging account was available in this task, so the browser symptom was not independently reproduced and this remains a code-supported root-cause assessment rather than completed operational proof.

**Correction:** Successful password sign-in now performs one full-document navigation using `window.location.assign`, so the destination is requested with the new cookie state. Login accepts a validated internal `?next=` value and otherwise uses `/dashboard`; absolute, protocol-relative, backslash/control-character, malformed/ambiguous encoded and login/logout-loop destinations are rejected. Customer/staff workspace boundary links also use full-document navigation. Middleware now preserves refreshed Supabase cookies and required no-cache headers when it returns a redirect.

**Verification:** Local lint, typecheck, 81 unit tests, 27 integration tests (plus 3 credential-gated skips), security guardrails and the production build passed. Unit tests cover successful and failed sign-in navigation, navigation failure, safe destinations and redirect bypasses. Integration tests cover unauthenticated protection and refreshed-cookie propagation across middleware redirects. Playwright executed but all four existing placeholders skipped, so it supplied no browser acceptance evidence. Real browser sign-in, sign-out, recovery completion, cross-workspace navigation and account switching remain staging acceptance checks.

**Lesson:** Authentication changes are a document boundary as well as a state change. Use one deliberate navigation after a successful browser-side sign-in, preserve refreshed cookies on replacement middleware responses, and do not treat compilation or unit tests as proof of a real browser session transition.

## 2026-10-27 — Hosted 026 status and private-preview decisions reconciled

**Follow-up:** The owner confirmed that migration 026 was applied after the earlier read-only ledger inspection through 025. PR #30 had already normalized migration 025's hosted history marker to numeric `025` without rerunning SQL. Current documentation now records hosted history through numeric `001`–`026` as owner-confirmed, not independently re-inspected, and does not invent an apply timestamp. Earlier dated entries saying 026 was not hosted remain accurate historical snapshots.

**Preview decision:** The accepted provisional stack is Netlify Free plus a separate Supabase Free staging project, GitHub for source/CI and Google Forms/Sheets for controlled access and feedback, at a strict ₦0 / $0 budget. The 12–20 November 2026 window and approximately 15–20 approved owners/board participants remain conditional on readiness. Netlify/staging deployment is not yet claimed, and the 10 MB application upload limit must be reconciled with Netlify request-payload limits in staging.

**Scope boundary:** Existing email/password, customer/staff permissions and dual-role testing remain the November model. Staff ID/password, possible authenticator MFA, separate staff/customer identities and conflict controls belong to January 2027. The updated staff dashboard PDF is a design reference, not evidence that those later controls or workflow concepts are implemented.

## 2026-10-27 - November direct evidence upload transport

**Problem:** Evidence binaries travelled through a Next.js Server Action before reaching Supabase Storage. Netlify Free's buffered function boundary cannot reliably carry Atexgrove's permitted 9-10 MiB files.

**Cause:** The original private-evidence implementation predated selection of Netlify Free for the preview and combined binary transport with server registration.

**Decision/fix (initial PR revision, superseded below):** The authenticated browser now performs cheap local validation and uploads the immutable object directly to private Supabase Storage under migration 026 INSERT RLS. It then calls a metadata-only finalization action. The server revalidates owner, state, filename and exact case/evidence/path binding; checks authoritative Storage metadata; fetches only bytes 0-7 with HTTP Range; validates the stored signature; and calls the unchanged `register_case_evidence` RPC. The initial revision attempted best-effort server-only cleanup after verification or registration failure; PR #32 security review found that unsafe because the deletion target came from the browser. Pending evidence remains staff-invisible and the audited staff-download path is unchanged.

**Accepted preview limitations:** A browser disconnect can leave a private unregistered object, pre-registration objects are not covered by reservation-level quota concurrency, and cleanup is manual/operator-controlled. No automatic expiry exists. Durable reservations are deferred, and no migration 027 was created.

**Local verification:** clean lockfile installation completed with the bundled npm 11 client. Lint and typecheck passed. All 90 unit tests passed. All 35 runnable integration tests passed, with the same three credential-gated security tests skipped. Security guardrails passed for eight application tables. The production build completed successfully. A read-only request against an existing private object confirmed HTTP 206, `Content-Range: bytes 0-7/941214`, `Content-Length: 8` and eight received bytes; Storage `info()` matched the bucket, exact path, size and MIME. Docker is unavailable locally, so pgTAP/database execution is deferred to the unchanged Database security tests workflow when the PR opens.

**Operational boundary:** No migration was added or applied, no hosted row/object was changed, no Netlify deployment or staging project was created, and no real deployed 9-10 MiB acceptance test is claimed.

**Lesson:** Keep large binary transport off buffered application functions while preserving server authority over registration. Direct upload is not direct trust: validate the stored object, keep the service role server-only and make orphan/concurrency trade-offs explicit.

## 2026-10-28 - PR #32 privileged deletion security correction

**Problem:** The first direct-upload revision could pass a browser-supplied `storagePath` to service-role Storage deletion after an ineligible case state, failed stored-object verification or failed database registration.

**Root cause:** Path binding and customer ownership limited cross-customer reach but did not prove that the object was newly uploaded or unregistered. A forged finalization request could reuse an immutable evidence path from the same customer's case.

**Security consequence:** A customer could cause deletion of their own already-registered evidence object, breaking evidence immutability and version-history guarantees even though the database row remained.

**Correction:** Finalization no longer imports an admin client or any deletion helper. It strictly validates the full generated path, authorizes owned case/state, performs a global server-only exact-path reference check, then verifies authoritative Storage metadata/signature and calls the existing RPC. Any failure leaves Storage and evidence rows unchanged and emits only a fixed reason code plus case/evidence IDs. The database UNIQUE constraint remains the final concurrent-duplicate safeguard.

**Regression tests:** Focused action tests cover ineligible/discarded cases, duplicate paths, verification/signature failures, registration errors and exceptions, cross-case/cross-customer attempts, malformed/encoded/traversal/extra-segment/extension paths and the normal success sequence. They assert that privileged deletion is never called. A source contract also prevents reintroducing admin deletion into finalization. Corrected commit `c015ccf57a10fc04cb401bf74755bddc91c7bce0` passed [application CI run 40674062503](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40674062503) and [database security run 40674062670](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/40674062670). These tests demonstrate call behavior and disposable-database authorization; physical Storage persistence still requires isolated staging acceptance.

**Lessons learned:** A path supplied by an authenticated browser is still untrusted and cannot be a privileged deletion authority. In preview, preserving potentially registered evidence is more important than automatic orphan cleanup. Reconciliation must be conservative, owner-approved and performed through the Storage API after a fresh exact-reference check.
