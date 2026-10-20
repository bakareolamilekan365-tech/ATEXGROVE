# Atexgrove Engineering Log

This log records significant engineering problems, their causes, the corrections made, and the lesson carried into later work. It is written to help future contributors understand why safeguards exist.

Do not add secrets, access tokens, private customer information, email addresses, or user IDs to this log.

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
