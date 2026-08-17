# Environment Variables Reference

This file distinguishes **current real integration variables** from variables belonging to still-scaffolded providers.

Never commit `.env.local`, private keys, access tokens, or production secrets.

## Application

| Variable | Runtime | Required now | Purpose |
|---|---|---:|---|
| `NEXT_PUBLIC_APP_URL` | Vercel / local | Yes | Public application base URL. Production is `https://cloud-ide-copilot.vercel.app`. |
| `NEXT_PUBLIC_APP_ENV` | Vercel / local | Recommended | `development`, `preview`, `production`, or `test`. |

## Supabase

| Variable | Runtime | Required now | Purpose |
|---|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel / local | For real persistence/auth phase | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel / local | For real persistence/auth phase | Browser-safe Supabase client key used by the current codebase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | For real persistence phase | Admin/service key. Never expose client-side. |

> Current blocker: migrations exist, but many runtime services still use `InMemoryDatabase`. Configuring these variables alone does not migrate those service paths to PostgreSQL.

## GitHub App

| Variable | Runtime | Required | Purpose |
|---|---|---:|---|
| `GITHUB_APP_ID` | Vercel | Yes for real GitHub App operations | GitHub App numeric ID. |
| `GITHUB_APP_CLIENT_ID` | Vercel | Depending on installation/OAuth flow | GitHub App Client ID. |
| `GITHUB_APP_CLIENT_SECRET` | Server only | Only if the chosen OAuth flow needs it | GitHub App OAuth secret. |
| `GITHUB_APP_PRIVATE_KEY` | Server only | Yes for app authentication | Full PEM private key. |
| `GITHUB_APP_WEBHOOK_SECRET` | Server only | Yes when webhooks are active | HMAC secret for webhook verification. |

## OpenRouter

| Variable | Runtime | Required | Purpose |
|---|---|---:|---|
| `OPENROUTER_API_KEY` | Vercel server | Yes for real incident diagnosis/review | OpenRouter API key. |
| `OPENROUTER_MODEL` | Vercel server | Optional | Default model. Current recommended default is `openrouter/auto`. |
| `OPENROUTER_ANALYSIS_MODEL` | Vercel server | Optional | Analysis override. |
| `OPENROUTER_CODING_MODEL` | Vercel server | Optional | Coding override for direct OpenRouter tools. |
| `OPENROUTER_REVIEW_MODEL` | Vercel server | Optional | Review override. |
| `OPENROUTER_FAST_MODEL` | Vercel server | Optional | Fast/low-cost override. |
| `ALLOW_MOCK_PROVIDERS` | Test only | No | Set to `true` only in deliberate offline/test fixtures. Never enable in Vercel Production. |

Outside tests, missing `OPENROUTER_API_KEY` now causes the provider to fail instead of silently returning fabricated AI output.

## OpenHands Cloud

The OpenHands repair task executes on Trigger.dev, so the OpenHands key belongs primarily in the **Trigger.dev task environment**.

| Variable | Runtime | Required | Purpose |
|---|---|---:|---|
| `OPENHANDS_API_URL` | Trigger.dev | Optional | Defaults to `https://app.all-hands.dev`. |
| `OPENHANDS_API_KEY` | Trigger.dev secret | Yes | OpenHands Cloud API key. |
| `OPENHANDS_CLOUD_API_KEY` | Trigger.dev secret | Optional alias | Accepted alias for `OPENHANDS_API_KEY`. |
| `OPENHANDS_MODEL` | Trigger.dev | Optional | Explicit model/profile selection. Leave blank to use OpenHands account configuration. |
| `OPENHANDS_GIT_WORKSPACE_PATH` | Trigger.dev | Optional | Defaults to `/workspace/project`. |
| `OPENHANDS_START_TIMEOUT_MS` | Trigger.dev | Optional | Startup polling timeout. |
| `OPENHANDS_EXECUTION_TIMEOUT_MS` | Trigger.dev | Optional | Agent execution polling timeout. |
| `OPENHANDS_POLL_INTERVAL_MS` | Trigger.dev | Optional | Polling frequency. |

For direct local health verification, also place the OpenHands key in your local shell or `.env.local`. It does not need to be duplicated into Vercel solely for the asynchronous repair task.

## Trigger.dev

| Variable | Runtime | Required | Purpose |
|---|---|---:|---|
| `TRIGGER_SECRET_KEY` | Vercel / local | Yes | Allows the control plane to trigger and retrieve task runs. Use DEV key locally and PROD key in Vercel Production. |
| `TRIGGER_API_URL` | Server | Optional | Defaults to Trigger.dev Cloud. |

The `openhands-repair` task itself must have access to `OPENHANDS_API_KEY` in the Trigger.dev environment.

## Sentry

| Variable | Runtime | Required | Purpose |
|---|---|---:|---|
| `SENTRY_WEBHOOK_SECRET` | Vercel server | When webhook enabled | Verify signed Sentry webhook payloads. |

Current Sentry->Trigger orchestration is still intentionally marked not wired.

## Vercel deployment API / Sandbox

These belong to still-incomplete provider paths in the current repository:

| Variable | Current status |
|---|---|
| `VERCEL_API_TOKEN` | Existing deployment provider uses it, but SaaS-grade connectable Vercel integration still needs implementation. |
| `VERCEL_TEAM_ID` | Optional metadata for current Vercel provider. |
| `VERCEL_SANDBOX_TOKEN` | Legacy/scaffold variable in the current code. The real `@vercel/sandbox` provider is not implemented in this update. |

Do not interpret those variables as proof that real Sandbox execution is working.

## code-server

| Variable | Current status |
|---|---|
| `CODE_SERVER_BASE_DOMAIN` | Future/partial browser IDE gateway. |
| `CODE_SERVER_SHARED_SECRET` | Future/partial browser IDE gateway. |

## TencentDB Agent Memory

Phase 2 only:

```text
TENCENT_AGENT_MEMORY_SECRET_ID=
TENCENT_AGENT_MEMORY_SECRET_KEY=
TENCENT_AGENT_MEMORY_REGION=ap-guangzhou
```

Do not make the MVP depend on these variables.
