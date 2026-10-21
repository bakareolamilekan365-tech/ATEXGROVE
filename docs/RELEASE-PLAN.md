# Release plan

**Planned, not implemented.** This document records the intended release approach; it is not a claim that hosting, previews, rollback automation or a staging database are configured.

## Planned hosting and review flow

- Host the web application on Vercel.
- Create a preview URL for each pull request so changes can be reviewed before release.
- Keep a production deployment with an instant rollback to the previous application deployment when a release has a problem.
- Maintain a separate staging Supabase project for trying reviewed migrations and application behavior before considering changes to the hosted project.
- Apply database changes only through the reviewed, tested, forward-only migration process described in [RUNBOOK.md](RUNBOOK.md).

## Why blue-green is not needed yet

The prototype has one shared Supabase database, so switching between two web application versions would not switch or isolate database state. Blue-green hosting would add operational complexity without making database migrations reversible. The practical protection is to test migrations on staging, keep them forward-only, maintain backups/recovery procedures, and deploy compatible application/database changes through review. Revisit blue-green deployment if the product later has production scale or infrastructure that justifies it.
