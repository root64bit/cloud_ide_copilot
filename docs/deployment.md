# Deployment Guide

Production application URL:

```text
https://cloud-ide-copilot.vercel.app/
```

## Vercel control plane

Configure the server-side provider secrets documented in `docs/environment-variables.md` and redeploy after environment changes.

For the OpenHands/Trigger.dev repair path, Vercel currently needs at minimum:

```text
TRIGGER_SECRET_KEY=<Trigger.dev production environment secret>
OPENROUTER_API_KEY=<OpenRouter key>
```

Do not expose either with `NEXT_PUBLIC_`.

## Trigger.dev deployment

Confirm `trigger.config.ts` points at your real Trigger.dev project, then deploy tasks:

```bash
npm run trigger:deploy
```

Configure `OPENHANDS_API_KEY` in the Trigger.dev environment used by that deployment.

See `docs/openhands-trigger-setup.md`.

## Supabase

The existing SQL migrations should be applied in order when moving to the real persistence phase:

```text
00001_initial_schema.sql
00002_rls_policies.sql
00003_audit_triggers.sql
00004_project_memory.sql
```

However, applying the migrations alone does not make the current application production-persistent. Core services must first be migrated off `InMemoryDatabase`.

## Webhooks

Current intended endpoints:

```text
https://cloud-ide-copilot.vercel.app/api/webhooks/github
https://cloud-ide-copilot.vercel.app/api/webhooks/sentry
```

Enable external webhooks only after the corresponding route is deployed, secrets are configured, signature verification is tested, and persistence/tenant mapping is correct.

## Production-readiness warning

Do not enable autonomous production repair/ship for customers yet. The current blockers are documented in `SETUP_REQUIRED.md` and `AUDIT_MANIFEST.md`.
