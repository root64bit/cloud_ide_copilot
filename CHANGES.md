# Changes — Real OpenHands Cloud + Trigger.dev Integration

Date: 2026-08-17

## Scope of this package

This update replaces the previous simulated **OpenHands** repair path and simulated **Trigger.dev** success path with real provider calls for the parts that can safely be wired now.

It intentionally does **not** claim that the full SaaS repair pipeline is production-ready. The current repository still contains scaffolded persistence, Vercel Sandbox, PR, browser IDE, and Sentry orchestration paths that must be completed in later phases.

## Implemented in this update

### 1. Real OpenHands Cloud V1 client

Added:

- `src/server/providers/agent/openhands-cloud.client.ts`

The client now performs real OpenHands Cloud V1 API operations for:

- starting an app conversation against a selected GitHub repository
- polling asynchronous conversation startup
- polling agent execution until a terminal state
- sending follow-up messages
- reading files
- reading Git changes
- reading per-file unified diffs
- returning the real OpenHands conversation URL / ID / sandbox ID

There is no fake OpenHands response fallback in this client.

### 2. Real OpenHands coding-agent provider

Reworked:

- `src/server/providers/agent/openhands.provider.ts`
- `src/server/providers/agent/agent.interface.ts`

`OpenHandsAgentProvider` now launches a real OpenHands Cloud conversation instead of asking OpenRouter to impersonate OpenHands and then editing a fake sandbox.

Safety prompt rules explicitly prohibit the agent from:

- committing
- pushing
- creating a PR
- merging
- deploying
- changing production secrets / environment files

The agent is instructed to leave source changes uncommitted so the platform can retrieve and review the real Git diff.

### 3. Real Trigger.dev tasks

Added:

- `src/trigger/engineering-health.task.ts`
- `src/trigger/openhands-repair.task.ts`

The `openhands-repair` task executes the OpenHands Cloud provider inside a real Trigger.dev worker and returns real identifiers/results.

The health task proves a real Trigger.dev worker executed instead of returning a local simulated success object.

### 4. Trigger.dev API integration

Added:

- `src/app/api/trigger/health/route.ts`
- `src/app/api/trigger/runs/[runId]/route.ts`

Updated:

- `src/app/api/workspaces/[workspaceId]/repair/route.ts`

The repair API now queues the real Trigger.dev `openhands-repair` task rather than directly executing the prior simulated provider chain.

### 5. Workspace UI polling

Updated:

- `src/app/(dashboard)/[orgSlug]/workspaces/[workspaceId]/page.tsx`

The workspace screen now:

- queues the Trigger.dev repair run
- polls the real Trigger.dev run status
- displays the real Trigger run ID
- displays the real OpenHands conversation ID / URL
- displays the real OpenHands Git diff returned by the task

### 6. Provider verification scripts

Added:

- `scripts/verify-openhands-health.mjs`
- `scripts/verify-trigger-health.mjs`
- `scripts/verify-trigger-openhands.mjs`

These scripts distinguish provider wiring from fake application success screens.

### 7. OpenRouter fail-closed behavior outside tests

Updated:

- `src/server/providers/ai/openrouter.provider.ts`

OpenRouter now:

- defaults model selection to `openrouter/auto` unless a tier-specific model is configured
- fails when `OPENROUTER_API_KEY` is absent outside tests
- keeps deterministic mock responses only for `NODE_ENV=test` or explicit `ALLOW_MOCK_PROVIDERS=true`

This prevents a production environment from silently claiming an AI analysis occurred when no OpenRouter request was made.

### 8. Fake Trigger.dev success tasks removed

The following tasks now fail explicitly instead of fabricating successful cloud work:

- `src/trigger/validation-pipeline.task.ts`
- `src/trigger/workspace-lifecycle.task.ts`
- `src/trigger/sentry-incident.task.ts`
- `src/trigger/workspace-cleanup.task.ts`

This is intentional. Their real backing services are not yet production-safe because persistence and Vercel Sandbox are still scaffolded.

### 9. Tests

Reworked:

- `tests/unit/providers/openhands.test.ts`

The unit test now uses API-shaped OpenHands responses and verifies that the provider returns real-style conversation metadata, Git changes, and a unified diff. It no longer tests the old simulated OpenRouter + fake sandbox behavior.

## Important security note

This repository still has a demo/in-memory authentication and persistence layer. Do not interpret the new real OpenHands/Trigger.dev connection as approval to expose autonomous repair actions to arbitrary production users yet.

See `SETUP_REQUIRED.md` for the exact next actions and blockers.
