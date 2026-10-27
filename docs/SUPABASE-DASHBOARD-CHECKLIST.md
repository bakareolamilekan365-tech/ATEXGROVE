# Supabase dashboard checklist

These are settings in the Supabase dashboard, not in the repo. Tick and date each one.

- [ ] Auth: minimum password length set to 8 or more. Verify: try registering with a 6-character password; it should be rejected.
- [ ] Auth: email confirmation turned on. Verify: a new sign-up should not get a session until the email link is used.
- [ ] **PRO PLAN REMINDER:** leaked-password protection is available on Supabase Pro and above. While this prototype remains on Free, record the advisor warning as an accepted plan limitation; do not block the prototype or imply that the control is enabled.
- [ ] Auth URL configuration: site URL and allowed redirect URLs include the implemented `/auth/callback` and password-recovery destinations; verify both flows end to end.
- [x] Owner confirmation received after the 2026-10-25 read-only check: migration 026 was applied and hosted history is consistent through numeric `001`–`026`. Treat this as owner-confirmed until a separately authorized read-only ledger inspection records fresh output; do not reapply 026.
- [x] 2026-10-14: no service-role key or `.env.local` is tracked by git; `.env.local` is ignored. Rotate any privileged credential that has been shared outside approved secret storage.
- [x] Historical CI evidence before migration 022's hosted apply: all six pgTAP suites (191 assertions) passed on disposable Supabase CI, [run 39909627678](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39909627678).
- [x] Historical CI evidence: migration 023 and all seven pgTAP suites (238 assertions) passed on disposable Supabase CI, [run 39948240244](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39948240244). At the time, 023 had not yet been applied to hosted.
- [x] Historical CI evidence: migration 023 disposable-CI run [39950544756](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39950544756) passed all seven pgTAP suites (250 assertions). Hosted status was updated after PR #26 merged (owner confirmation).
- [x] Historical CI run [39954573310](https://github.com/bakareolamilekan365-tech/ATEXGROVE/actions/runs/39954573310) passed eight pgTAP suites (287 assertions) for the initial migration 024 implementation on disposable Supabase. It predates the annual-numbering follow-up; migration 024 is now recorded in the linked hosted ledger.
- [x] 2026-10-23: migration 022 applied to hosted Supabase; hosted state then was `001`–`022`. Migration 023 was later applied after PR #26 merged, per owner confirmation. Linked migration ledger checked 2026-10-23 now reads through 024 (apply date for 024 not reported).
- [x] **Historical 2026-10-21 snapshot:** hosted migration history then contained `001`-`021`; migration 021 was applied and migration 022 was not yet hosted.
- [x] 2026-10-14: re-ran Supabase security and performance advisors after deployment; unresolved findings are recorded in the latest audit addendum.
- [ ] Resolve or explicitly accept every remaining advisor finding before claiming foundation verification or production readiness.
- [ ] Review the informational advisory for `public.verification_case_number_counters`. Repository migration 024 enables RLS, revokes `public`, `anon`, `authenticated` and `service_role` table access, defines no client policy, and permits allocation only inside the reviewed `SECURITY DEFINER` submit function. Confirm hosted evidence before calling the advisor resolved; do not add a client policy merely to silence it.
