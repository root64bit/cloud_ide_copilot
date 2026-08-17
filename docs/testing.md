# Testing & Verification Strategy

The project has Vitest unit/integration tests for security primitives, RBAC/state logic, providers, and workflow concepts.

## Standard local checks

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

## Provider verification added in the OpenHands/Trigger.dev update

### OpenHands Cloud API reachability

```bash
npm run openhands:health
```

Requires a local `OPENHANDS_API_KEY` and performs a safe API health call.

### Trigger.dev worker

```bash
npm run trigger:health
```

Queues `engineering-health-check`. A real pass requires the run to exist in Trigger.dev and complete from a Trigger.dev worker.

### Trigger.dev -> OpenHands

```bash
OPENHANDS_TEST_REPOSITORY=root64bit/cloud-ide-copilot npm run verify:trigger-openhands
```

The task is explicitly instructed to inspect only and make no repository changes.

A real pass requires both:

```text
real Trigger.dev run ID
real OpenHands conversation ID
```

and both must be visible in their provider dashboards.

## Test doubles

Mock providers may be used in unit tests. They must not be interpreted as production provider verification.

OpenRouter mock responses are now restricted to test mode or explicit `ALLOW_MOCK_PROVIDERS=true`.

## Important current limitation

Some existing integration tests exercise the in-memory service layer and simulated sandbox/PR workflow. They validate logic/state transitions, not real Supabase/Vercel/GitHub cloud execution.

The production-readiness suite must be expanded after the real persistence and Vercel Sandbox phases.

## Planned triple-audit release verification

For major changes, the target release gate is:

```text
Layer 1: deterministic engineering
  tests + lint + typecheck + build + security scans

Layer 2: browser QA
  Playwright -> Stagehand -> OmniParser fallback
  followed by deterministic DOM/API/DB assertions

Layer 3: independent AI review
  multiple approved OpenRouter models

Then: explicit human ship approval
```
