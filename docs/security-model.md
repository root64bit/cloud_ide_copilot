# Security Model & Defense-in-Depth

The AI Engineering Platform enforces defense-in-depth principles across authentication, authorization, sandbox execution, external integrations, and secret management.

---

## 1. Multi-Tenant Isolation
- **Row Level Security (RLS)**: Every PostgreSQL table enforces tenant isolation using `organization_id` policies checked against `auth.uid()`.
- **Server-Side Authorization**: API routes and domain services independently execute `AuthGuard.assertPermission()` prior to running any query or provider call.
- **Cross-Tenant Leakage Prevention**: Project memory, audit records, and sandboxes are strictly isolated by organization and project IDs.

---

## 2. Sandbox Execution Security
- **Production Immutability**: Production servers and files are completely immutable and never directly editable.
- **Command Allowlist**: Ad-hoc and configured commands are strictly validated against an approved binary list (`npm`, `pnpm`, `yarn`, `bun`, `npx`, `git`, `node`, `vitest`, `jest`, `eslint`, `tsc`, `next`, `turbo`).
- **Shell Injection Prevention**: Metacharacters like `;`, `&&`, `|`, `` ` ``, `$(...)`, `>`, `<` are strictly rejected.
- **Git Command Guard**: Git subcommands are restricted to `status`, `diff`, `log`, `branch`, `checkout`, `rev-parse`, `show`, `add`, `commit`. Dangerous arguments such as `--force` or arbitrary remote pushes are blocked.
- **Protected Branch Guard**: Direct pushes or branches named `main`, `master`, `production`, `prod`, `release`, `staging` are blocked. All repairs must target `ai-repair/*`.

---

## 3. Secret Management & Redaction
- **Zero Production Secrets in Sandboxes**: No production keys (e.g. `SUPABASE_SERVICE_ROLE_KEY`, Stripe live keys, bank credentials) are passed into the sandbox.
- **Multi-Pattern Redaction Engine**: Over 15 sensitive credential patterns (Bearer tokens, JWTs, API keys, database connection passwords, private keys, cookies, basic auth) are automatically redacted from:
  - Command stdout/stderr logs
  - Audit event metadata
  - Sentry stack traces and request bodies
  - LLM prompts sent to external AI providers
  - Client component props

---

## 4. Webhook Security
- **Sentry Webhooks**: HMAC-SHA256 signature verification (`sentry-hook-signature`) with timing-safe comparison to prevent timing attacks.
- **GitHub Webhooks**: HMAC-SHA256 signature verification (`x-hub-signature-256`).
- **Data Scrubbing**: Stack traces and request payloads are sanitized before ingestion.

---

## 5. Human Production Approval Gate
- **No Autonomous Auto-Merge**: AI agents cannot approve or merge PRs to production.
- **Validation Requirement**: Repaired code must pass automated tests (`install`, `test`, `lint`, `typecheck`, `build`) before moving to review.
- **RBAC Enforcement**: Merging to production requires explicit human authorization from an `owner` or authorized `admin`.
- **Immutable Audit Trail**: All privileged events (workspace creation, AI repairs, command executions, PR approvals) are recorded in an append-only audit log protected by database triggers.
