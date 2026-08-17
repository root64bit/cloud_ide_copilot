# Sandbox Architecture & Browser IDE

## Current status

`SandboxProvider` and command-safety utilities exist, but the current `VercelSandboxProvider` is still a simulation and must **not** be treated as real release evidence.

The real `@vercel/sandbox` implementation is a required next phase.

## Intended isolation model

Each repair should receive its own isolated workspace containing:

```text
selected repository
selected base commit
repair branch context
safe/staging environment variables only
package manager/toolchain
allowlisted validation commands
```

Production credentials must not be copied into the sandbox by default.

## Intended OpenHands -> validation handoff

OpenHands Cloud is currently a separate coding-agent execution environment. The target deterministic flow is:

```text
OpenHands Cloud
  -> real uncommitted Git diff
  -> retrieve diff through OpenHands V1 API
  -> create deterministic Vercel Sandbox
  -> clone the same repository/base commit
  -> apply the diff
  -> actual install/test/lint/typecheck/build
  -> persist real exit codes/output
```

OpenHands output alone is never proof that a test/build passed.

## Command safety

`src/lib/security/allowlist.ts` provides the existing allowlist/shell-injection boundary. When real Sandbox execution is added, all platform-triggered commands must pass through the allowlist and their output must be truncated/redacted before persistence.

## Browser IDE

code-server remains planned/partial. The final IDE must be scoped to the isolated repair workspace, protected by authenticated short-lived access, and must never point at a production filesystem.

## Future alternative

CubeSandbox may be considered later behind `SandboxProvider` if self-hosting, cost, scale, or cloud independence justify replacing Vercel Sandbox.
