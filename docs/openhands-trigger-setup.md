# OpenHands Cloud + Trigger.dev

## Roles

- **OpenHands Cloud**: coding agent and repository working-copy analysis/repair.
- **OpenRouter**: model gateway used by the platform/OpenHands configuration.
- **Trigger.dev**: durable OpenHands job execution and repair-artifact persistence.
- **Vercel Sandbox**: deterministic validation/shipping workspace, controlled by the Vercel-hosted control plane in the current architecture.

## Required Trigger.dev worker environment

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SECRET_KEY
OPENHANDS_API_KEY
OPENHANDS_API_URL=https://app.all-hands.dev
OPENHANDS_MODEL=                 # optional
```

Deploy:

```bash
npm run trigger:deploy
```

## Health checks

```bash
npm run openhands:health
npm run trigger:health
```

`trigger:health` talks directly to Trigger.dev. The HTTP `/api/trigger/health` route is intentionally authenticated and requires organization integration-management permission.

## Trigger -> OpenHands verification

Use a persisted staging repair workspace and configure:

```text
OPENHANDS_VERIFY_WORKSPACE_ID
OPENHANDS_VERIFY_ORGANIZATION_ID
OPENHANDS_VERIFY_PROJECT_ID
OPENHANDS_VERIFY_INCIDENT_ID
OPENHANDS_TEST_REPOSITORY=owner/repository
OPENHANDS_TEST_BRANCH=main
```

Then:

```bash
npm run verify:trigger-openhands
```

The verification task requests read-only inspection. It must not commit, push, create a PR, or deploy.

## Repair workflow

```text
Vercel API queues openhands-repair
 -> Trigger.dev worker checks persisted workspace/tenant/project/incident identity
 -> OpenHands Cloud conversation runs
 -> real diff retrieved
 -> secret-sensitive repair is rejected if detected
 -> repair artifact stored in Supabase
 -> Vercel control plane syncs artifact into Vercel Sandbox
 -> deterministic validation begins
```

Reserved Trigger tasks for workspace lifecycle/validation/cleanup/Sentry auto-diagnosis currently fail closed where a machine-actor or external-Sandbox credential policy has not yet been approved.
