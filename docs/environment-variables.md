# Environment Variables

`.env.example` is the canonical sanitized list. Real secret values belong in Vercel/Trigger.dev secret stores and local `.env.local`, never in Git.

## Public

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

## Supabase server

```text
SUPABASE_SECRET_KEY
```

## GitHub App

```text
GITHUB_APP_ID
GITHUB_APP_CLIENT_ID
GITHUB_APP_PRIVATE_KEY
GITHUB_APP_WEBHOOK_SECRET
GITHUB_APP_CLIENT_SECRET   # only when GitHub user-authorization/OAuth is enabled
```

## AI

```text
OPENROUTER_API_KEY
OPENROUTER_MODEL
OPENROUTER_ANALYSIS_MODEL
OPENROUTER_CODING_MODEL
OPENROUTER_REVIEW_MODEL
OPENROUTER_FAST_MODEL

OPENHANDS_API_KEY
OPENHANDS_API_URL
OPENHANDS_MODEL
```

## Trigger.dev

```text
TRIGGER_SECRET_KEY
```

The Trigger.dev worker environment additionally requires the Supabase/OpenHands server variables used by the repair task.

## Sentry

```text
SENTRY_WEBHOOK_SECRET
```

## Vercel

```text
VERCEL_TOKEN
VERCEL_TEAM_ID
VERCEL_PROJECT_ID
```

The current deployment-discovery provider uses `VERCEL_TOKEN`. Vercel-hosted Sandbox operations should use Vercel deployment identity/OIDC automatically. Do not manually configure `VERCEL_OIDC_TOKEN` on the Vercel deployment.

## Non-production development/test switches

```text
ALLOW_DEV_AUTH=false
DEV_USER_ID=
DEV_USER_EMAIL=
ALLOW_MOCK_PROVIDERS=false
```

Production code refuses mock-provider mode even if `ALLOW_MOCK_PROVIDERS=true` is accidentally present.
