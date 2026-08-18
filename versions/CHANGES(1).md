# Hardening V2 Changes

This revision converts the current repair foundation toward a truthful production control plane. It intentionally does **not** claim that browser IDE, triple-audit, billing, or public-SaaS connector onboarding are complete.

## Security and tenancy

- Supabase-backed runtime persistence and authenticated organization membership remain the authority outside explicit test/dev mock mode.
- Production can no longer enable `ALLOW_MOCK_PROVIDERS=true`; mock fallbacks are restricted to tests or non-production development.
- The Trigger.dev health API now requires a real authenticated user plus `org:manage_integrations`; it returns only a run ID and no Trigger public access token.
- Workspace repair queue responses no longer expose Trigger public access tokens.
- Incident AI analysis resolves the incident first and authorizes against its persisted organization. Client-provided organization IDs are not accepted as authority.
- OpenHands repair results are rejected before persistence if they modify secret/environment/private-key files or if the unified diff matches known secret patterns.

## Real release observation

- Migration `00006_release_observation_hardening.sql` records the canonical GitHub merge commit SHA.
- Pull requests are unique per repair workspace in the current release model.
- Preview and production deployments are upserted by provider deployment ID.
- Human approval records the actual GitHub merge SHA.
- A workspace reaches `completed` only when a real Vercel **production** deployment for that exact merge SHA is observed as READY.
- A merged workspace automatically resumes production observation after page reload or after the foreground approval poll stops.

## Real repair chain

- OpenHands Cloud remains the coding-agent boundary.
- Trigger.dev remains the durable worker boundary for OpenHands execution and repair artifact persistence.
- Vercel Sandbox remains the isolated execution boundary for applying the persisted patch and running deterministic validation.
- GitHub App installation tokens remain short-lived and are removed from Sandbox Git remotes after clone/push operations.
- Repair branch push, PR creation, Vercel Preview observation, and human merge remain separate gates.

## UI/data truth

- Organization/dashboard/project/incident/workspace/deployment/audit/team screens consume tenant-scoped persisted data rather than production demo rows.
- Repository connection only offers repositories visible to the current GitHub App installation session.
- Browser IDE remains explicitly `not wired` instead of presenting a fake IDE URL.
- Public `/api/health` is now a liveness endpoint only and makes no claim that external providers are ready.

## Verification scripts

- `scripts/verify-trigger-health.mjs` now verifies Trigger.dev directly using the Trigger SDK, because the production health route is authenticated.
- `scripts/verify-trigger-openhands.mjs` now requires a real persisted workspace/organization/project/incident rather than inventing IDs that the hardened Trigger task correctly rejects.

## Explicitly deferred

- Secure public-SaaS GitHub installation-to-user/organization binding with GitHub user authorization/OAuth.
- Customer-owned Vercel account authorization/install tokens. Current deployment discovery is suitable for projects reachable by the configured platform/team credentials.
- code-server browser IDE.
- Playwright + Stagehand + OmniParser triple-audit engine.
- Multi-model release review/consensus.
- M-Pesa subscriptions, usage credit accounting, and billing.
- TencentDB Agent Memory production integration.
