# Deployment

## Control plane

The main Next.js application deploys to Vercel:

```text
https://cloud-ide-copilot.vercel.app/
```

Apply Supabase migrations through `00006_release_observation_hardening.sql` before deploying this source.

## Provider environments

Vercel must contain the server-side Supabase, GitHub App, OpenRouter, OpenHands/Trigger control-plane, Sentry, and current Vercel deployment-discovery configuration documented in `.env.example`.

Trigger.dev must contain the Supabase/OpenHands environment required by the `openhands-repair` worker. Deploy tasks with:

```bash
npm run trigger:deploy
```

## Release safety

A repair does not ship by changing Vercel production directly. The path is:

```text
Vercel Sandbox
 -> deterministic validation
 -> ai-repair Git branch
 -> GitHub Pull Request
 -> Vercel Preview observed READY
 -> explicit authorized human approval
 -> GitHub merge
 -> exact merge SHA observed in READY Vercel production deployment
```

Only the final observed production deployment moves the repair workspace to `completed`.

## Public SaaS warning

The current GitHub installation setup and Vercel deployment-discovery credentials are suitable for the private/platform-owned MVP. Before third-party customer onboarding, implement secure GitHub user-authorization/OAuth installation binding and customer-specific Vercel Integration/OAuth credentials.
