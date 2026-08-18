# Vercel Sandbox Architecture & Browser IDE

## Current status

`VercelSandboxProvider` is a real `@vercel/sandbox` implementation.

It supports:

- isolated persistent sandbox creation
- private GitHub repository clone using a short-lived GitHub App installation token
- exact base-commit checkout
- credential scrubbing from the Git remote
- allowlisted command execution
- safe workspace path enforcement
- file read/write
- `git apply --check` before patch application
- Sandbox stop
- repair-branch commit/push with temporary Git credentials

The browser IDE/code-server portion is intentionally **not implemented** yet.

## OpenHands -> deterministic validation handoff

```text
OpenHands Cloud
  -> real uncommitted Git diff
  -> persist repair artifact in Supabase
  -> Vercel-hosted control plane retrieves artifact
  -> existing exact-commit Vercel Sandbox
  -> git apply --check
  -> apply patch
  -> install/test/lint/typecheck/build
  -> persist real exit codes/output
```

OpenHands test claims are never the release authority; deterministic Sandbox exit codes are.

## Secret boundaries

- Production application secrets are not automatically copied into repair Sandboxes.
- GitHub installation credentials are temporary and removed from the Git remote after use.
- Secret/environment/private-key file modifications are rejected before agent repair artifacts are persisted and again before Git shipping.
- Command output is truncated and redacted before persistence.

## Authentication

When the control plane runs on Vercel, Sandbox operations should use Vercel deployment identity/OIDC. External workers need explicit Vercel Sandbox credentials if they are ever allowed to operate the Sandbox directly.

## Browser IDE

`getBrowserIdeUrl()` currently fails closed with `CODE_SERVER_NOT_WIRED`. Future code-server access must:

- bind to one repair Sandbox only
- use a short-lived authenticated access mechanism
- never expose production filesystems/secrets
- be revocable when the workspace stops/expires
- work acceptably on mobile/tablet while the main UI covers common repair actions without requiring the full IDE

## Future alternative

CubeSandbox can remain behind the provider interface as a future self-hosted/scale/cost alternative.
