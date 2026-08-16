# Sandbox Architecture & code-server Browser IDE

The platform utilizes **Vercel Sandbox** (`@vercel/sandbox`) for isolated workspace execution, dependency installation, running tests, and hosting `code-server` for browser-based IDE editing.

---

## 1. Sandbox Isolation Model

- **Ephemeral Lifecycles**: Sandboxes are created on-demand when an incident is opened or an engineer requests a workspace.
- **Configurable TTL & Inactivity**: Sandboxes expire automatically after 60 minutes of inactivity (managed by Trigger.dev cron task `workspace-cleanup`).
- **Zero Production Secrets**: No real production API keys, Supabase service keys, or database credentials are provided to the sandbox container. Staging or mock variables are injected where required.

---

## 2. Command Allowlisting & Shell Injection Defense

Commands execute through `src/lib/security/allowlist.ts`:
- Validates binary against approved allowlist (`npm`, `pnpm`, `yarn`, `bun`, `npx`, `git`, `node`, `vitest`, `jest`, `eslint`, `tsc`, `next`, `turbo`).
- Blocks all shell metacharacters (`;`, `&&`, `|`, `` ` ``, `$(...)`, `>`, `<`).
- Restricts Git commands to safe status, diff, branch inspection, and commits on `ai-repair/*` branches.
- Truncates output to prevent memory exhaustion and redacts all secrets before persistence in `command_runs`.

---

## 3. code-server Browser IDE

- `code-server` runs inside the sandbox container.
- Accessible via a time-limited signed session token:
  `https://ide.engineering.example.com/?sandbox=sbx_123&token=base64url_token`
- Scoped strictly to the isolated temporary repository directory.
- Edits made in `code-server` affect only the sandbox filesystem and are committed to `ai-repair/*` when ready.
- Never directly connected to production infrastructure.

---

## 4. Future Sandbox Alternative: CubeSandbox

If high sandbox density, self-hosting on private cloud clusters, or infrastructure independence becomes necessary, **CubeSandbox** (https://github.com/tencentcloud/CubeSandbox) can be swapped in behind the `SandboxProvider` interface without modifying application logic.
