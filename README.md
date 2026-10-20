# Atexgrove

Atexgrove is a Next.js prototype for a trusted digital ecosystem for land development in Africa.

## Current status

See [docs/STATUS.md](docs/STATUS.md) for the single current record of implemented slices, hosted migrations/configuration, CI evidence and remaining verification gaps.

## How this was built
Built with AI assistants (OpenCode, Codex, Claude) under my review. The original product specifications were AI-generated and are being revised.
Demo data is labelled "DEMO DATA / NOT OFFICIAL".

## Project layout

- `docs/` contains the product and implementation specifications.
- `src/` contains the Next.js application, features, shared components, libraries, and types.
- `supabase/` contains database migrations, functions, and seed configuration.
- `data/` contains clearly labelled synthetic demo data.
- `tests/` contains unit, integration, and end-to-end test areas.

## Development

```bash
npm install
npm run dev
```

Demo records must be labelled **DEMO DATA / NOT OFFICIAL**. Unimplemented roadmap features should be marked as planned rather than represented as working functionality.
