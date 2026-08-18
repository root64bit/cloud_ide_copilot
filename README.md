# Cloud IDE Copilot

A multi-project AI engineering control plane for remote incident triage, coding-agent repairs, isolated validation, Git/Vercel previews, and human-controlled production releases.

Production URL:

```text
https://cloud-ide-copilot.vercel.app/
```

## Current implementation status

This repository is an **active production-foundation build**, not yet a finished commercial SaaS.

### Real foundation currently implemented in source

- **Supabase persistence + Auth** — server-side user resolution, tenant membership and RBAC-backed repositories.
- **GitHub App** — short-lived installation tokens, repository verification, repair branch push, PR creation, and human-approved merge.
- **OpenRouter** — real model gateway; production fails closed when not configured.
- **OpenHands Cloud V1** — real conversation creation/polling, Git change discovery and diff retrieval.
- **Trigger.dev** — real `engineering-health-check` and `openhands-repair` tasks.
- **Vercel Sandbox** — real `@vercel/sandbox` provider for exact-commit clone, command execution, patching, file IO, stop, and repair-branch push.
- **Deterministic validation** — install/test/lint/typecheck/build execute against the isolated Sandbox and use real exit codes.
- **Vercel Preview gate** — repair PRs wait for an observed Vercel Preview.
- **Human production gate** — AI cannot merge directly. The authorized user approves the merge.
- **Production observation** — a workspace reaches `completed` only after the exact GitHub merge SHA is observed in a READY Vercel production deployment.
- **Sentry foundation** — signed webhook validation, payload sanitization, explicit project mapping, and incident persistence.

### Intentionally incomplete

- Public-SaaS-safe GitHub installation binding via GitHub user authorization/OAuth.
- Customer-owned Vercel Integration/OAuth installation flow.
- Browser IDE/code-server.
- Triple Audit: Playwright -> Stagehand -> OmniParser -> deterministic backend/DB evidence.
- Multi-model release consensus/review.
- Durable scheduled Sandbox cleanup/machine-actor policy.
- M-Pesa subscriptions and usage billing.
- TencentDB Agent Memory production integration.

See [`AUDIT_MANIFEST.md`](AUDIT_MANIFEST.md) and [`SETUP_REQUIRED.md`](SETUP_REQUIRED.md) for the authoritative current gates.

---

## Repair architecture

```text
Authenticated user
        |
        v
Supabase tenant/RBAC
        |
        v
Sentry incident / operator repair request
        |
        v
OpenRouter diagnosis
        |
        v
Trigger.dev durable OpenHands job
        |
        v
OpenHands Cloud
        |
   real Git diff
        |
        v
Persist repair artifact
        |
        v
Vercel-hosted control plane
        |
        v
Vercel Sandbox exact-commit clone
        |
 git apply --check + patch
        |
        v
install / test / lint / typecheck / build
        |
        v
GitHub App ai-repair branch + PR
        |
        v
real Vercel Preview
        |
        v
explicit human approval
        |
        v
GitHub merge SHA
        |
        v
exact Vercel production deployment observed
        |
        v
workspace completed
```

The coding agent is never the production deployment authority.

---

## Technology stack

- Next.js App Router
- React
- TypeScript strict mode
- Tailwind CSS
- Supabase PostgreSQL/Auth
- GitHub App / Octokit
- OpenRouter
- OpenHands Cloud
- Trigger.dev
- Vercel Sandbox
- Sentry
- Vercel
- Vitest

Planned follow-up:

- code-server
- Playwright + Stagehand
- OmniParser visual fallback
- multi-model release review
- M-Pesa billing
- TencentDB Agent Memory behind the memory-provider abstraction

---

## Local setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Never commit real credentials.

Quality checks:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

---

## OpenHands + Trigger.dev verification

Deploy Trigger.dev tasks after their environment is configured:

```bash
npm run trigger:deploy
```

Direct checks:

```bash
npm run openhands:health
npm run trigger:health
```

For the Trigger.dev -> OpenHands integration verification, use a **real persisted staging repair workspace** and configure:

```text
OPENHANDS_VERIFY_WORKSPACE_ID
OPENHANDS_VERIFY_ORGANIZATION_ID
OPENHANDS_VERIFY_PROJECT_ID
OPENHANDS_VERIFY_INCIDENT_ID
OPENHANDS_TEST_REPOSITORY=owner/repository
OPENHANDS_TEST_BRANCH=main
```

Then run:

```bash
npm run verify:trigger-openhands
```

The verification instruction is read-only and prohibits commit/push/PR/deploy.

---

## Database

Apply Supabase migrations in order through:

```text
supabase/migrations/00006_release_observation_hardening.sql
```

Do not deploy this revision against a database that has not received the required migrations.

---

## Documentation

- [Architecture](docs/architecture.md)
- [Security model](docs/security-model.md)
- [Database](docs/database.md)
- [Provider interfaces](docs/provider-interfaces.md)
- [GitHub setup](docs/github-setup.md)
- [Vercel setup](docs/vercel-setup.md)
- [Sandbox](docs/sandbox.md)
- [OpenHands + Trigger.dev](docs/openhands-trigger-setup.md)
- [Local development](docs/local-development.md)
- [Deployment](docs/deployment.md)
- [Environment variables](docs/environment-variables.md)
- [Testing](docs/testing.md)
- [Roadmap](docs/roadmap.md)

Handoff/audit notes:

- [`AUDIT_MANIFEST.md`](AUDIT_MANIFEST.md)
- [`CHANGES.md`](CHANGES.md)
- [`SETUP_REQUIRED.md`](SETUP_REQUIRED.md)
- [`TEST_RESULTS.md`](TEST_RESULTS.md)


## Known gaps

- **Vercel project mapping:** connected GitHub repositories do not yet have a seamless verified Vercel project selector; release preview/production observation requires the correct persisted `vercel_project_id`.
