# Isolated staging — November private preview

**Status:** repository scaffolding only. This PR does not create a Netlify site, provision Supabase, apply a migration, deploy the app, or invite anyone. It is independent of PR #33. Keep the budget at **₦0 / $0**.

## Boundaries and ownership

- Production / the current hosted Supabase project stays unchanged.
- Provision a **new and distinct Supabase Free project** for staging; confirm the Free quota before any new project creation. Never copy real accounts, sensitive case data, production private evidence, keys, or Auth users into staging.
- Use a **separate Netlify site or controlled preview context** connected to the repository. Do not point it at the current hosted database. Preview links may be accessible to anyone who has the URL: an application sign-in screen and noindex are not access control. Do not invite the board until access controls are verified.
- Only synthetic demonstration data and individually approved test accounts are allowed. Do not treat the UI-only `NEXT_PUBLIC_PRIVATE_PREVIEW` setting as a registration-security boundary.
- Keep PR #33 open; staging from `main` is a backend acceptance environment first. Previewing PR #33 there is a later, separate UI acceptance step. No automatic merge or deploy of PR #33.

## Step 1 — Owner-controlled provider setup

1. Confirm existing Supabase organization plan, current active-project count and that creation of a second project remains free. Create a new project with a clearly separate staging name **only after confirming no extra cost**.
2. Inspect the new project reference in the Supabase dashboard. Record the existing hosted and new staging refs privately as separate values; never assume the current `main` database is staging.
3. In Netlify, configure **Deploy Preview and Branch Deploy environment contexts** using the isolated staging project's values. These context-specific variables must have Build and Functions availability where required:
   - `STAGING_SUPABASE_PROJECT_REF`: the approved new staging ref (non-secret)
   - `PRODUCTION_SUPABASE_PROJECT_REF`: the current hosted project's ref (non-secret; compared solely for safety)
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://<staging-ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: staging's client-safe publishable/anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: **staging-only server secret**, never a browser variable or repository value
   - `NEXT_PUBLIC_PRIVATE_PREVIEW=true`
4. Do **not** configure shared/fallback Netlify variables that silently use production credentials in Deploy Preview or Branch Deploy contexts. Review each environment-variable scope and redeploy after changes. Do not commit secrets to `netlify.toml`, workflows, issues or source files.
5. Netlify uses Node 22 in this configuration, matching the installed Supabase packages' supported Node runtime. This does not provision Netlify or guarantee that a connected site exists.

## Step 2 — Fail-closed build preflight

Netlify's preview/branch build contexts invoke:

```sh
node scripts/staging-preflight.mjs && npm run build
```

The preflight intentionally **fails** if staging project URL/ref is malformed or disagrees, the staging and hosted production refs match, required keys are missing, or private preview is disabled. It prints names of configuration problems, **never credential values**.

Run the isolated regression tests without credentials:

```sh
node --test tests/staging-preflight.test.mjs
```

The check is **not** proof that the service-role key belongs to the staging project, public Supabase signup is disabled, the DB is migrated, or Auth/Storage access is correct. Those require separate operator checks.

## Step 3 — Only after project identity is verified, migrate staging

Use the existing reviewed `docs/RUNBOOK.md` procedure. Before linking, confirm the new staging project ref a second time.

```sh
npx supabase --help
npx supabase login
npx supabase link --project-ref <APPROVED_STAGING_PROJECT_REF>
npx supabase migration list
npx supabase db push --dry-run
```

Inspect the planned migration sequence, expected through `026`, and **stop** if any project name/ref differs from staging. Only after explicit operator approval, run `npx supabase db push` against staging, then rerun migration history verification. Do not run `db reset`, `db push` or seed commands on the existing hosted project.

## Step 4 — Close access and authentication gates

- Configure staging Auth site URL and redirect allowlist to the exact approved Netlify test origin/callback; verify confirmation and password-reset emails using test accounts.
- Disable unrestricted public sign-up at the **Supabase Auth provider level** while allowing only individually authorized test accounts. Hiding the registration button is insufficient. Confirm the desired invitation/provisioning flow separately.
- Create synthetic customer, Verification Lead, regular staff, dual-role and unrelated-account identities as needed. Never reuse real emails and never post credentials in PR comments.
- Test customer/staff authorization, RLS, pending evidence privacy, incorrect-user denial, role boundaries and authenticated sign-out in real browsers.

## Step 5 — Hosting and evidence acceptance

Using staging only, test at least a valid approximately 1 MiB, 5 MiB and 9–10 MiB file through:

```
browser → private Supabase Storage → metadata-only Netlify finalizer → registration
```

Test ineligible states, wrong customer, unsupported content/signature, interrupted uploads and duplicate retries. Confirm the uploaded bytes do not traverse the Netlify function. Confirm pending evidence stays staff-invisible until explicit submission or authorized reply; check audited access and safe orphan reconciliation using the existing runbook.

Also verify loading/redirect behavior, preview-only branding and account protection, registration restriction, email flows, responsive customer/staff usability and simulated activity. CI passing is not hosted acceptance.

## Exit criteria before board invitations

- [ ] Distinct, approved staging Supabase project; existing hosted project untouched
- [ ] Correct Netlify context-specific credentials and a passing preflight
- [ ] Staging migration history verified through `026`
- [ ] Provider-level registration/access policy verified; synthetic accounts only
- [ ] Netlify-deployed full case/evidence journey works with permitted 9–10 MiB files
- [ ] Customer, lead, assignee, unrelated user and dual-role access checks pass
- [ ] Backup/export and isolation/recovery procedure agreed and tested for the demo
- [ ] Owner signs off before distributing private-preview links

## Non-goals

No UI redesign, no new dashboard, no additional land/report workflow, no new migration, no production rollback, no paid add-on or automatic project creation. Landing imagery and blurred sign-in/loading transition stay on PR #33's separate UI acceptance list.
