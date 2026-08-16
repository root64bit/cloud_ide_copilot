# Environment Variables Reference

Reference table for all environment variables used by the AI Engineering Platform.

| Variable Name | Required | Provider | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | App | Base URL for the SaaS frontend |
| `NEXT_PUBLIC_APP_ENV` | Yes | App | Runtime environment (`development`, `production`, `test`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase | Supabase API and Auth endpoint URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase | Supabase anonymous public client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase | Supabase backend admin service role key |
| `GITHUB_APP_ID` | Yes | GitHub | GitHub App ID for Octokit authentication |
| `GITHUB_APP_CLIENT_ID` | Yes | GitHub | GitHub App OAuth Client ID |
| `GITHUB_APP_CLIENT_SECRET` | Yes | GitHub | GitHub App OAuth Client Secret |
| `GITHUB_APP_PRIVATE_KEY` | Yes | GitHub | RSA Private Key for GitHub App token exchange |
| `GITHUB_APP_WEBHOOK_SECRET` | Yes | GitHub | Webhook HMAC signing secret |
| `VERCEL_API_TOKEN` | Yes | Vercel | Vercel REST API token for deployments & preview URLs |
| `VERCEL_TEAM_ID` | Optional | Vercel | Vercel Team ID |
| `VERCEL_SANDBOX_TOKEN` | Yes | Vercel | `@vercel/sandbox` execution token |
| `SENTRY_WEBHOOK_SECRET` | Yes | Sentry | Sentry webhook HMAC-SHA256 signature secret |
| `OPENROUTER_API_KEY` | Yes | OpenRouter | OpenRouter LLM Gateway API key |
| `OPENROUTER_ANALYSIS_MODEL` | Optional | OpenRouter | Analysis model (default: `anthropic/claude-3.5-sonnet`) |
| `OPENROUTER_CODING_MODEL` | Optional | OpenRouter | Coding agent model (default: `anthropic/claude-3.5-sonnet`) |
| `OPENROUTER_REVIEW_MODEL` | Optional | OpenRouter | Review model (default: `openai/gpt-4o`) |
| `OPENROUTER_FAST_MODEL` | Optional | OpenRouter | Fast triage model (default: `openai/gpt-4o-mini`) |
| `OPENHANDS_API_URL` | Optional | OpenHands | Self-hosted or cloud OpenHands agent endpoint |
| `TRIGGER_SECRET_KEY` | Optional | Trigger.dev | Trigger.dev API secret key for background tasks |
| `CODE_SERVER_BASE_DOMAIN` | Optional | code-server | Domain for browser IDE sandbox proxy |
| `TENCENT_AGENT_MEMORY_SECRET_ID` | Optional | TencentDB | Phase 2 TencentDB Agent Memory Secret ID |
| `TENCENT_AGENT_MEMORY_SECRET_KEY` | Optional | TencentDB | Phase 2 TencentDB Agent Memory Secret Key |
