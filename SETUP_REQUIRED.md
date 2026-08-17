# Setup Required — OpenHands Cloud + Trigger.dev

This document describes exactly what must be configured outside the repository after applying this update.

## 1. OpenHands Cloud

You already created the OpenHands account/API key. Confirm the OpenHands account has GitHub access to the repository you want to test.

For the safest setup, the real OpenHands API key should live in the environment where the OpenHands task executes: **Trigger.dev**.

Add to Trigger.dev project environment variables:

```text
OPENHANDS_API_KEY=<secret>
OPENHANDS_API_URL=https://app.all-hands.dev
```

Optional:

```text
OPENHANDS_MODEL=
OPENHANDS_GIT_WORKSPACE_PATH=/workspace/project
OPENHANDS_START_TIMEOUT_MS=300000
OPENHANDS_EXECUTION_TIMEOUT_MS=2700000
OPENHANDS_POLL_INTERVAL_MS=5000
```

If `OPENHANDS_MODEL` is blank, OpenHands can use the model/profile configured in your OpenHands account. Your OpenHands account may use OpenRouter as its model provider.

Do **not** send the API key to ChatGPT and do not commit it.

## 2. Trigger.dev

The repository currently contains this Trigger.dev project ref in `trigger.config.ts`:

```text
proj_yrzkermulzkjpgxbkrsm
```

Confirm that this is the project you created for Cloud IDE Copilot. If it is not, replace it with the correct Trigger.dev project ref before deploying tasks.

### Local environment

Put the Trigger.dev DEV secret in `.env.local`:

```text
TRIGGER_SECRET_KEY=tr_dev_...
```

### Vercel environment

Put the Trigger.dev PROD secret in the Vercel project `cloud-ide-copilot`:

```text
TRIGGER_SECRET_KEY=tr_prod_...
```

Never use `NEXT_PUBLIC_` for this variable.

### Trigger.dev Cloud environment

In the Trigger.dev dashboard, add the OpenHands variables listed in section 1 to the environment used by the deployed task.

## 3. Deploy the real Trigger.dev tasks

From the updated project directory:

```bash
npm ci
npm run trigger:deploy
```

Confirm the Trigger.dev deployment contains at least:

```text
engineering-health-check
openhands-repair
```

The other orchestration tasks intentionally fail with `*_NOT_WIRED` until their real providers are implemented.

## 4. Verify OpenHands directly

For a local direct provider check, put `OPENHANDS_API_KEY` in `.env.local` or your shell environment, then run:

```bash
npm run openhands:health
```

Expected truth signal:

```text
OPENHANDS_CLOUD_HEALTH=PASS
```

This proves the API key can reach OpenHands Cloud. It does not modify a repository.

## 5. Verify Trigger.dev worker execution

Run the app locally or deploy it, then:

```bash
npm run trigger:health
```

Expected first response:

```text
TRIGGER_QUEUE_HEALTH=PASS runId=run_...
```

Then inspect the returned run in Trigger.dev or poll:

```text
/api/trigger/runs/run_...
```

The run must become `COMPLETED` and its log must show `Real Trigger.dev worker executed`.

## 6. Verify Trigger.dev -> OpenHands end-to-end

Use a repository that the OpenHands GitHub integration can access. Start with `root64bit/cloud-ide-copilot` or another non-critical test repository.

Set locally:

```text
OPENHANDS_TEST_REPOSITORY=root64bit/cloud-ide-copilot
OPENHANDS_TEST_BRANCH=main
TRIGGER_SECRET_KEY=tr_dev_...
```

Then run:

```bash
npm run verify:trigger-openhands
```

This verification prompt tells OpenHands to inspect the repository and make **no file changes**, no commit, no push, no PR, and no deployment.

A real successful result must include:

```text
TRIGGER_OPENHANDS_VERIFY=PASS
OPENHANDS_CONVERSATION_ID=<real id>
OPENHANDS_PATCH_APPLIED=false
```

Also verify the conversation exists in your OpenHands dashboard and the Trigger run exists in your Trigger.dev dashboard.

## 7. OpenRouter

In Vercel, configure:

```text
OPENROUTER_API_KEY=<secret>
OPENROUTER_MODEL=openrouter/auto
```

Optional per-purpose overrides:

```text
OPENROUTER_ANALYSIS_MODEL=
OPENROUTER_CODING_MODEL=
OPENROUTER_REVIEW_MODEL=
OPENROUTER_FAST_MODEL=
```

The production provider no longer silently returns mock AI responses when the API key is missing.

## 8. Redeploy Vercel

After setting the production Trigger.dev and OpenRouter variables, redeploy:

```text
https://cloud-ide-copilot.vercel.app/
```

## 9. Do not enable full production repair yet

The following are still blockers in this repository and are intentionally **not** claimed as complete by this update:

### BLOCKER A — Application persistence is still in-memory

`InMemoryDatabase` is still used by core services, RBAC, incidents, workspaces, AI analyses, audit records, PRs, and several pages.

A Trigger.dev worker is a different process from a Vercel request, so in-memory state cannot be the production source of truth.

Required next phase:

```text
Replace InMemoryDatabase service paths with real Supabase/PostgreSQL repositories + authenticated user context.
```

### BLOCKER B — Vercel Sandbox provider is still simulated

`src/server/providers/sandbox/vercel-sandbox.provider.ts` does not yet execute `@vercel/sandbox` workloads.

Required next phase:

```text
Implement real @vercel/sandbox clone / command / file / stop operations.
```

### BLOCKER C — Validation workflow is intentionally disabled

`validation-pipeline.task.ts` now fails instead of fabricating passing tests.

After real Vercel Sandbox is wired, the intended architecture is:

```text
OpenHands real diff
        -> apply diff to deterministic Vercel Sandbox workspace
        -> install
        -> test
        -> lint
        -> typecheck
        -> build
        -> release gate
```

### BLOCKER D — PR path still uses mock Git provider in API routes

The current PR/approval routes still instantiate `MockGitProvider` and do not synchronize the OpenHands diff into a real repository branch.

Required next phase:

```text
GitHub App installation token
        -> repair branch
        -> apply validated diff
        -> commit
        -> push
        -> PR
        -> Vercel Preview
```

### BLOCKER E — Production authentication is still scaffolded

Several API routes accept or hard-code demo user IDs / organization IDs. This is not sufficient for a commercial multi-tenant SaaS.

Required next phase:

```text
Supabase Auth session
        -> server-side org membership
        -> RBAC
        -> project/workspace ownership
        -> every privileged API call
```

### BLOCKER F — Trigger run status endpoint needs real product authorization

`/api/trigger/runs/[runId]` uses the server Trigger secret to retrieve full run output. It must be protected by the final authenticated organization/workspace ownership check before public launch.

## 10. Production launch gate

Do not call the platform production-ready until all blockers above are resolved and the following real flow passes:

```text
Authenticated engineer
 -> real project persisted in Supabase
 -> real incident
 -> Trigger.dev run
 -> real OpenHands Cloud conversation
 -> real diff
 -> real Vercel Sandbox validation
 -> real GitHub App branch/PR
 -> real Vercel Preview
 -> human approval
 -> production merge
```
