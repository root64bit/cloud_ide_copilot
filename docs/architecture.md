# System Architecture

Cloud IDE Copilot is a multi-tenant AI engineering control plane for incident handling, isolated code repair, deterministic validation, Git/Vercel previews, and explicit human production approval.

## Current real repair path

```text
Web / mobile client
      |
      v
Next.js control plane on Vercel
      |
      +-- Supabase Auth + PostgreSQL tenant/RBAC authority
      +-- GitHub App
      +-- Sentry
      +-- OpenRouter
      |
      v
Trigger.dev durable OpenHands job
      |
      v
OpenHands Cloud coding agent
      |
   real Git diff
      |
      v
Supabase repair artifact
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
explicit authorized human approval
      |
      v
GitHub merge SHA
      |
      v
exact READY Vercel Production deployment
```

## Authority model

```text
OpenHands = coding/reasoning authority inside an isolated working copy
Vercel Sandbox = deterministic command/test/build authority
GitHub/Vercel observations = release/deployment evidence
Human owner/admin = production approval authority
```

AI has no direct merge/deploy permission in the workflow.

## Provider boundaries

### Supabase

Runtime repositories use Supabase outside tests/explicit non-production mock mode. Server-side Auth and organization membership are resolved before privileged operations.

### OpenHands + Trigger.dev

`openhands-repair` is a real Trigger.dev task. It invokes OpenHands Cloud and persists the real repair artifact. It does not control production or Git shipping.

### Vercel Sandbox

`VercelSandboxProvider` uses `@vercel/sandbox` for isolated clone/command/file/patch/stop operations. Sandbox creation/validation currently runs from the Vercel-hosted control plane to use the platform's Vercel execution identity. The reserved external Trigger lifecycle/validation tasks fail closed until explicit external Vercel credentials/machine policy are configured.

### GitHub

GitHub App installation tokens provide short-lived repository credentials. Repair changes are pushed only to protected `ai-repair/*` branches. PR merge occurs only after the explicit production-approval gate.

### Vercel release evidence

Preview readiness is observed from Vercel. After human merge, the canonical GitHub merge SHA is stored and the workspace is marked `completed` only after a Vercel production deployment with that exact SHA is READY.

## Remaining architecture gates

- Public-SaaS-safe GitHub installation binding using GitHub user authorization/OAuth.
- Customer-specific Vercel Integration/OAuth installation.
- Browser IDE/code-server authenticated to the isolated workspace.
- Triple Audit engine and multi-model release review.
- Scheduled workspace cleanup machine policy.
- Usage metering/M-Pesa billing.
