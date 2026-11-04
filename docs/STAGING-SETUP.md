# Isolated staging — November private preview

**Verified configuration, 2026-11-04:** the separate Supabase staging project already exists and is active, with migrations `001`–`026` recorded. The existing Netlify site `atexgrove` has a published deployment in Netlify's `production` context. Its public Supabase URL and publishable key currently point to staging. This PR changes repository build safeguards only; it does not create infrastructure, change hosted configuration, apply migrations, deploy, or invite anyone. Keep the budget at **₦0 / $0**.

**Pending acceptance:** verify the deployment's server-side credentials and variable scopes, Supabase Auth restrictions, private Storage and RLS behavior, Netlify visitor access, and real customer/staff journeys before external board access. A ready deployment and passing preflight do not establish those results.

## Boundaries and ownership

- Production / the current hosted Supabase project stays unchanged.
- Use the existing, distinct Supabase staging project `rogovqltseeqdugsjood`. The existing hosted project is `caueewwwnzwtuaiuabdt`; no additional project is needed. Never copy real accounts, sensitive case data, production private evidence, keys, or Auth users into staging.
- Use only the approved existing Netlify site `atexgrove` (`c36c8384-8a73-42df-a19f-b2debd6c7ea5`) for this guard. Its published build uses Netlify's `production` **deployment context** while targeting staging through public Supabase configuration. The context name does not authorize use of the existing hosted database. An application sign-in screen and noindex are not visitor-access controls. Do not invite the board until access controls are verified.
- Only synthetic demonstration data and individually approved test accounts are allowed. Do not treat the UI-only `NEXT_PUBLIC_PRIVATE_PREVIEW` setting as a registration-security boundary.
- Keep PR #33 open; staging from `main` is a backend acceptance environment first. Previewing PR #33 there is a later, separate UI acceptance step. No automatic merge or deploy of PR #33.

## Step 1 — Owner-controlled configuration review

1. Confirm in the Supabase dashboard that the staging project is `rogovqltseeqdugsjood`, separate from the existing hosted project `caueewwwnzwtuaiuabdt`. Migration history `001`–`026` is already recorded on staging; no new project creation or migration push is required for this PR.
2. Review the existing Netlify site's **Production, Deploy Preview and Branch Deploy** variable values and scopes. Several public Supabase variables are currently scoped to all deployment contexts. Confirm the correct staging values are present in the build and function scopes where required, and that the server-only key belongs to staging. The preflight checks key presence, not key ownership. Do not print or copy secret values into logs or documentation.
3. Required Netlify environment variables are:
   - `STAGING_SUPABASE_PROJECT_REF`: the approved staging ref (non-secret)
   - `PRODUCTION_SUPABASE_PROJECT_REF`: the current hosted project's ref (non-secret; compared solely for safety)
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://<staging-ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: staging's client-safe publishable/anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: **staging-only server secret**, never a browser variable or repository value
   - `NEXT_PUBLIC_PRIVATE_PREVIEW=true`
   - `SITE_ID`: supplied automatically as a read-only Netlify build variable. It must identify the approved site in **Production, Deploy Preview and Branch Deploy**; do not configure it manually in Netlify.
4. Do **not** allow shared/fallback Netlify variables to point any permitted context at the existing hosted project. Review each variable's build/function scope and deployment-context values. Do not commit secrets to `netlify.toml`, workflows, issues or source files.
5. This repository configuration requests Node 22 for builds. Confirm the effective build/runtime versions from the Netlify deployment logs; the preflight does not verify them.

## Step 2 — Fail-closed build preflight

Every Netlify build context, including the approved site's `production` context, invokes:

```sh
node scripts/staging-preflight.mjs && npm run build
```

The preflight accepts only `production`, `deploy-preview` and `branch-deploy`. **Every** supported context requires the exact approved `SITE_ID`, staging ref and existing-hosted ref, as well as the exact staging HTTPS origin, required keys and private-preview flag. Internally consistent declarations for a different project still fail. Missing or unknown contexts fail. The global build command runs the preflight before Next.js compilation. It prints configuration problem names, **never credential values**. Netlify documents `SITE_ID` as a [read-only build variable](https://docs.netlify.com/build/configure-builds/environment-variables/).

Run the isolated regression tests without credentials:

```sh
node --test tests/staging-preflight.test.mjs tests/staging-context-guard.test.mjs
```

The approved site ID is a configuration guard, not proof of authorization or database isolation. The check does **not** prove that the service-role key belongs to staging, public Supabase signup is disabled, or Auth/Storage/RLS access is correct. Those require separate operator checks.

## Step 3 — Review staging migration history

Migrations `001`–`026` are already recorded on staging. Use the existing reviewed `docs/RUNBOOK.md` procedure for read-only confirmation. Before linking, confirm the staging project ref a second time.

```sh
npx supabase --help
npx supabase login
npx supabase link --project-ref <APPROVED_STAGING_PROJECT_REF>
npx supabase migration list
npx supabase db push --dry-run
```

Inspect the migration sequence through `026` and **stop** if the project name/ref differs from staging or the dry run proposes an unexpected migration. This PR does not require a database push. Do not run `db reset`, `db push` or seed commands on the existing hosted project.

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

- [x] Distinct staging Supabase project exists; existing hosted project is a separate project
- [ ] Correct Netlify context-specific credentials and a passing preflight
- [x] Staging migration history recorded through `026`
- [ ] Provider-level registration/access policy verified; synthetic accounts only
- [ ] Netlify-deployed full case/evidence journey works with permitted 9–10 MiB files
- [ ] Customer, lead, assignee, unrelated user and dual-role access checks pass
- [ ] Backup/export and isolation/recovery procedure agreed and tested for the demo
- [ ] Owner signs off before distributing private-preview links

## Non-goals

No UI redesign, no new dashboard, no additional land/report workflow, no new migration, no production rollback, no paid add-on or automatic project creation. Landing imagery and blurred sign-in/loading transition stay on PR #33's separate UI acceptance list.
