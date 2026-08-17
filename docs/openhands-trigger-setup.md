# OpenHands Cloud + Trigger.dev Integration

## Responsibility split

```text
Vercel / Next.js control plane
    -> authenticates operator (future production auth gate)
    -> diagnoses incident through OpenRouter
    -> queues Trigger.dev task

Trigger.dev worker
    -> invokes OpenHands Cloud V1 API
    -> waits for real agent execution
    -> retrieves real Git changes and diffs
    -> returns provider identifiers/output

OpenHands Cloud
    -> launches its coding sandbox
    -> opens the selected GitHub repository/branch
    -> executes the coding agent
    -> leaves proposed changes uncommitted
```

This keeps long-running agent work outside the lifetime of a Next.js request.

## OpenHands endpoints used

The client is isolated in:

```text
src/server/providers/agent/openhands-cloud.client.ts
```

It uses the OpenHands Cloud V1 app-conversation API for starting/polling conversations, follow-up messages, Git changes, and Git diffs.

The API key is never included in client-side output.

## Trigger tasks

### `engineering-health-check`

A minimal real task that proves a Trigger.dev worker executed.

### `openhands-repair`

Receives JSON-serializable context:

```text
workspaceId
repository owner/name
branch
incident title
structured diagnosis
optional operator instruction
```

It starts OpenHands and returns:

```text
provider
externalRunId
conversationId
sandboxId
conversationUrl
executionStatus
modifiedFiles
unified diff
repairPlan (UI compatibility projection)
```

## Important limitation

The OpenHands sandbox is not yet the deterministic validation sandbox.

The intended next implementation is to retrieve the OpenHands unified diff and apply it to a real Vercel Sandbox workspace. The Vercel Sandbox becomes the release authority for tests/build checks; OpenHands remains the coding agent.
