# Cloud IDE Copilot

A multi-project AI engineering control plane for remote incident triage, coding-agent repairs, deterministic validation, Git/Vercel previews, and human-controlled production releases.

Production URL:

```text
https://cloud-ide-copilot.vercel.app/
```

## Current implementation status

This repository is an **active production-foundation build**, not a fully finished commercial SaaS yet.

### Real provider paths now wired

- **OpenHands Cloud V1 API** — real app-conversation creation, polling, Git change discovery, and diff retrieval.
- **Trigger.dev** — real `engineering-health-check` and `openhands-repair` tasks.
- **OpenRouter** — real API required outside tests; missing production credentials fail closed instead of silently returning fake AI output.
- **GitHub App** — provider/client scaffold exists and the external GitHub App can be configured with short-lived installation tokens.
- **Sentry webhook verification** — signed-webhook provider code exists.

### Still scaffolded / blocked for production

- Core application data/RBAC still use `InMemoryDatabase` in many runtime paths despite the Supabase migrations existing.
- `VercelSandboxProvider` is not a real `@vercel/sandbox` implementation yet.
- Full validation orchestration is intentionally disabled rather than returning fake PASS results.
- PR/approval API routes still use a mock Git provider.
- code-server URL/workspace integration is not real yet.
- several dashboard pages still contain demo data.
- production multi-tenant authentication/authorization must be wired to Supabase Auth + persisted organization membership before autonomous repair actions are publicly enabled.

See [`SETUP_REQUIRED.md`](SETUP_REQUIRED.md) for the exact production blockers.

---

## Intended architecture

```text
Sentry incident / operator request
            |
            v
Cloud IDE Copilot (Vercel)
            |
       OpenRouter diagnosis
            |
            v
        Trigger.dev
            |
            v
      OpenHands Cloud
      real coding agent
            |
         real Git diff
            |
            v
   [NEXT PHASE: real Vercel Sandbox]
   test / lint / typecheck / build
            |
            v
   GitHub repair branch + PR
            |
            v
      Vercel Preview
            |
            v
      Human approval
            |
            v
        Production
```

The agent is **not** the production deployment authority.

---

## Technology stack

- Next.js 15 App Router
- React 19
- TypeScript strict mode
- Tailwind CSS
- Supabase PostgreSQL/Auth schema foundation
- GitHub App / Octokit
- OpenRouter
- OpenHands Cloud
- Trigger.dev
- Sentry
- Vercel
- Vitest

Planned/follow-up:

- real `@vercel/sandbox`
- code-server
- Playwright + Stagehand audit engine
- OmniParser visual fallback
- multi-model release review
- M-Pesa billing
- TencentDB Agent Memory behind the memory-provider abstraction

---

## Local setup

### Install

```bash
npm ci
```

### Environment

```bash
cp .env.example .env.local
```

Never commit real credentials.

### Development

```bash
npm run dev
```

### Quality checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

---

## OpenHands + Trigger.dev verification

After configuring the external providers, deploy Trigger.dev tasks:

```bash
npm run trigger:deploy
```

Check OpenHands directly:

```bash
npm run openhands:health
```

Check real Trigger.dev worker execution:

```bash
npm run trigger:health
```

Verify the complete Trigger.dev -> OpenHands Cloud connection using a non-critical repository:

```bash
OPENHANDS_TEST_REPOSITORY=root64bit/cloud-ide-copilot npm run verify:trigger-openhands
```

The verification task explicitly tells OpenHands not to change files, commit, push, create a PR, or deploy.

Full instructions: [`docs/openhands-trigger-setup.md`](docs/openhands-trigger-setup.md).

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

Audit package notes:

- [`CHANGES.md`](CHANGES.md)
- [`SETUP_REQUIRED.md`](SETUP_REQUIRED.md)
- [`TEST_RESULTS.md`](TEST_RESULTS.md)
