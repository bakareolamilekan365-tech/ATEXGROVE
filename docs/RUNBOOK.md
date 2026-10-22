# Atexgrove Operator Runbook

This runbook covers current development and hosted-configuration procedures. It does not authorize unreviewed production changes. Use synthetic data only.

## Owner-request intake and delivery rule

Owner requests do not move directly from chat into implementation. Record each request in [BACKLOG.md](BACKLOG.md), identify its source, and triage it as now, next or later before starting work. Keep one scoped backlog item in progress per feature branch. Database migrations and security changes must use the normal review and CI loop; never apply them to hosted Supabase just because a request was received.

## Apply reviewed Supabase migrations

Run these commands from the repository root. Review the dry-run output before applying anything:

```powershell
npx supabase login
npx supabase link --project-ref caueewwwnzwtuaiuabdt
npx supabase migration list
npx supabase db push --dry-run
npx supabase db push
npx supabase migration list
```

Only run the real `db push` after the migration PR is reviewed, database CI is green and hosted application is explicitly approved. Never edit an already-applied migration; add a forward migration.

## Add or update a staff member

Staff provisioning is a controlled database-operator action. First create or identify the Auth user in the Supabase dashboard, then run SQL like the following in the Supabase SQL Editor:

```sql
insert into public.staff_members (user_id, department, is_lead, active)
values ('<AUTH_USER_UUID>'::uuid, 'Verification', false, true)
on conflict (user_id) do update
set department = excluded.department,
    is_lead = excluded.is_lead,
    active = excluded.active;
```

Allowed departments are `Verification`, `Feasibility` and `Operations`. Only one active lead is allowed per department. Confirm the intended department and lead status before running the statement. Never commit, paste into documentation or share a real user UUID in chat.

## Required local environment variables

Create `.env.local` locally and keep it out of git:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` holds the client-safe publishable key used by this repository. `SUPABASE_SERVICE_ROLE_KEY` is server-only: never expose it to browser code, commit it, place it in documentation or paste it into chat. Rotate a privileged credential if it is exposed.

## Local setup and troubleshooting

After pulling changes:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000/register` to create a test account or `http://localhost:3000/login` to sign in.

If Next.js reports `Cannot find module` for a generated chunk, stop the development server, delete the local `.next` directory, then restart:

```powershell
Remove-Item -LiteralPath .next -Recurse -Force
npm run dev
```

Only delete the repository-local `.next` build cache. Do not delete source or dependency directories as part of this fix.

## Reset a forgotten application password

1. Open `/forgot-password` from the application or use **Forgot your password?** on `/login`.
2. Enter the account email and submit. The response remains generic and does not reveal whether an account exists.
3. Open the Supabase recovery email on the same trusted device/browser.
4. The callback should exchange the recovery code and send the user to `/update-password`.
5. Enter and confirm the new password, then sign in again.

If the link is expired or invalid, request a new recovery email. Do not invent or manually copy recovery tokens. Hosted redirect, expiry and error behavior still requires complete operational verification; see [STATUS.md](STATUS.md).

## Switch accounts while testing

Use the **Sign out** button in the customer dashboard or staff workspace, then sign in with the other synthetic test account. A private/incognito browser window is an alternative when you need to keep two test accounts signed in at once. Do not use real customer data for account-isolation tests.
