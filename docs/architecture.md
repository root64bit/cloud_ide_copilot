# System Architecture

Cloud IDE Copilot is being built as a multi-tenant AI engineering control plane for production incident handling, coding-agent repair, deterministic validation, Git/Vercel preview workflows, and explicit human production approval.

This document distinguishes the **target architecture** from the **current implementation**.

## Target architecture

```text
Web / Mobile client
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
Trigger.dev durable workflow
        |
        v
OpenHands Cloud coding agent
        |
     real Git diff
        |
        v
Vercel Sandbox deterministic validation
  install / test / lint / typecheck / build
        |
        v
GitHub repair branch + PR
        |
        v
Vercel Preview
        |
 deterministic + browser + AI audit gates
        |
        v
explicit authorized human approval
        |
        v
production branch / Vercel Production
```

## Current real boundaries

### OpenHands

`OpenHandsAgentProvider` now calls the real OpenHands Cloud V1 API. It starts a repository conversation, waits for agent execution, and retrieves real Git changes/diffs. It is not allowed to commit, push, open PRs, merge, or deploy.

### Trigger.dev

Real tasks currently wired:

```text
engineering-health-check
openhands-repair
```

The validation, workspace lifecycle, Sentry orchestration, and cleanup tasks intentionally fail closed until the backing persistence/sandbox operations are real.

### OpenRouter

OpenRouter is the LLM gateway for structured incident diagnosis/review in the Vercel control plane. In non-test environments, missing credentials now produce a configuration error instead of a fabricated result.

## Current blockers

### Persistence/authentication

The SQL schema and RLS policies exist, but current server services/RBAC/pages still use `InMemoryDatabase` in many paths. This means the database is not yet the runtime multi-tenant authority.

### Vercel Sandbox

The provider interface exists, but the current `VercelSandboxProvider` is simulated. A real `@vercel/sandbox` implementation is the next major infrastructure task.

### Git shipping

The GitHub App provider exists, but the PR/approval API routes still instantiate a mock Git provider and do not yet push the validated OpenHands change set.

### Browser IDE

The code-server concept/UI is not yet backed by a proven isolated workspace.

## Required authority model

The intended hierarchy is:

```text
AI coding agent = proposes/modifies isolated source
Vercel Sandbox = deterministic test/build authority
Audit engine = release evidence / gates
Human = production approval authority
```

No AI/provider should be able to skip the release gate and write directly to production.
