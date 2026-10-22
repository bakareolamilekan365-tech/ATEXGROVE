# Supabase dashboard checklist

These are settings in the Supabase dashboard, not in the repo. Tick and date each one.

- [ ] Auth: minimum password length set to 8 or more. Verify: try registering with a 6-character password; it should be rejected.
- [ ] Auth: email confirmation turned on. Verify: a new sign-up should not get a session until the email link is used.
- [ ] **PRO PLAN REMINDER:** leaked-password protection is available on Supabase Pro and above. While this prototype remains on Free, record the advisor warning as an accepted plan limitation; do not block the prototype or imply that the control is enabled.
- [ ] Auth URL configuration: site URL and allowed redirect URLs include the implemented `/auth/callback` and password-recovery destinations; verify both flows end to end.
- [x] 2026-10-14: no service-role key or `.env.local` is tracked by git; `.env.local` is ignored. Rotate any privileged credential that has been shared outside approved secret storage.
- [ ] Run all six pgTAP suites (180 planned assertions after migration 022) in an isolated Docker-capable environment or GitHub Actions and record the exact passing run. Current PR CI verification is pending.
- [x] 2026-10-21: hosted migration history contains `001`-`021`; migration 021 was applied 2026-10-21. Migration 022 is not hosted.
- [x] 2026-10-14: re-ran Supabase security and performance advisors after deployment; unresolved findings are recorded in the latest audit addendum.
- [ ] Resolve or explicitly accept every remaining advisor finding before claiming foundation verification or production readiness.
