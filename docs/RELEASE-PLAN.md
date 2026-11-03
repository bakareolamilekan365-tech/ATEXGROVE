# Release plan

**Planned, not implemented.** This document records the intended release approach; it is not a claim that hosting, previews, rollback automation or a staging database are configured.

## Planned hosting and review flow

- Use Netlify Free for the Next.js private-preview application; this decision supersedes Vercel as the selected near-term provider.
- Use a separate Supabase Free staging project for Auth, database and private Storage. Never point preview testing at the existing hosted project.
- Keep GitHub for source control/CI and Google Forms/Sheets for access requests and participant feedback.
- Keep the strict preview budget at ₦0 / $0; do not add paid providers or automatic upgrades.
- Create private review/deploy previews only after configuration and access controls are approved. Neither Netlify staging nor account provisioning is currently claimed complete.
- Apply database changes only through the reviewed, tested, forward-only migration process described in [RUNBOOK.md](RUNBOOK.md).

## Provisional November 2026 preview

Target 12–20 November 2026 for approximately 15–20 approved owners and board members, using fictional data and individual accounts. The Google access-request form has been distributed. The preview retains Supabase email/password, existing customer/staff permissions, the dual-role test arrangement and a separate customer-only test account. It is a private interactive test, not a public launch, professional verification or government certification.

Readiness requires realistic account/session tests, hosted email-flow checks and a full fictional-data journey. The repository now bypasses [Netlify's buffered function limit](https://docs.netlify.com/build/functions/configuration/) for evidence bytes by uploading from the authenticated browser directly to private Supabase Storage, then using a metadata-only server finalizer. A permitted 9–10 MiB upload must still work through deployed Netlify plus isolated Supabase staging before invitations; repository tests alone do not close that gate.

## January 2027 staff-identity workstream

Staff ID/password, possible authenticator MFA, separate staff/customer identities, employee customer-access controls and conflict-of-interest safeguards are planned separately. They are not November acceptance requirements and are not implemented by the current preview.

## Why blue-green is not needed yet

The prototype has one shared Supabase database, so switching between two web application versions would not switch or isolate database state. Blue-green hosting would add operational complexity without making database migrations reversible. The practical protection is to test migrations on staging, keep them forward-only, maintain backups/recovery procedures, and deploy compatible application/database changes through review. Revisit blue-green deployment if the product later has production scale or infrastructure that justifies it.
