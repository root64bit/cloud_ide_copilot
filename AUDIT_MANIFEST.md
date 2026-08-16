# AUDIT MANIFEST: AI Engineering Platform

## 1. Project Metadata

- **Project Name**: AI Engineering Platform (`cloud-ide-copilot` / `engineering.example.com`)
- **Current Git Branch**: `main`
- **Current Commit SHA**: `40fdbc103b2f87831cee54d64e0235576adf18ba`
- **Framework & Version**: Next.js 15.5.23 (App Router, React 19.0.0, TypeScript 5.7.3 strict mode)
- **Styling**: Tailwind CSS 3.4.17
- **Package Manager**: npm (with pinned `package-lock.json`)
- **Supported Node Runtime**: Node.js 20.x / 22.x
- **Target Deployment Platform**: Vercel (Frontend & Server Functions) + Supabase (PostgreSQL & Auth)

---

## 2. Milestone Implementation Status

| Capability / Subsystem | Status | Description |
|---|---|---|
| **Multi-Tenant Foundation & Database** | `IMPLEMENTED` | PostgreSQL migrations with Supabase Auth, Row Level Security (RLS) policies, and immutable triggers preventing modification of audit logs. |
| **Server-Side RBAC Engine** | `IMPLEMENTED` | Strict permission hierarchy (`owner > admin > engineer > viewer`) with server-side authorization enforcement via `AuthGuard.assertPermission()`. |
| **GitHub App Integration** | `IMPLEMENTED` | Decoupled `GitProvider` interface with `GitHubAppProvider` utilizing Octokit / `@octokit/app`, short-lived tokens, repository listing, commits, branch creation, and PR management. Protected branches (`main`, `master`, `production`, `release`) strictly guarded. |
| **Repository Discovery & Configuration** | `IMPLEMENTED` | Connect GitHub App -> Select repository -> Configure safe execution commands (`install`, `test`, `lint`, `typecheck`, `build`) -> Store project settings. |
| **Vercel Integration** | `IMPLEMENTED` | `DeploymentProvider` interface with `VercelDeploymentProvider` for project info, deployments, and preview URL tracking. |
| **Vercel Sandbox Execution** | `IMPLEMENTED` | `@vercel/sandbox` bridge (`VercelSandboxProvider`) and deterministic test sandbox (`MockSandboxProvider`) with tokenized command allowlist and output truncation. |
| **Repair Workspaces** | `IMPLEMENTED` | Complete workspace lifecycle (`creating -> cloning -> ready -> analyzing -> repairing -> validating -> ready_for_review -> pr_created -> preview_ready -> approved -> merged -> completed`) with state machine rules. |
| **Browser IDE (code-server)** | `IMPLEMENTED` | Scoped proxy session generation (`code-server`) connected strictly to the isolated sandbox workspace with explicit production isolation. |
| **Sentry Webhook Ingestion** | `IMPLEMENTED` | Signed webhook receiver (`/api/webhooks/sentry`) with HMAC-SHA256 signature verification (`sentry-hook-signature`) and sensitive data sanitization (stripping auth tokens, cookies, passwords, API keys). |
| **OpenRouter LLM Gateway** | `IMPLEMENTED` | Multi-tier model routing (Analysis, Coding, Review, Fast) with structured JSON Schema output validation via Zod (`IncidentDiagnosisSchema`, `RepairPlanSchema`, `RiskReviewSchema`). |
| **OpenHands Coding Agent** | `IMPLEMENTED` | Decoupled `CodingAgent` interface (`OpenHandsAgentProvider`) coordinating workspace investigation, code AST inspection, and surgical bugfix patch generation. |
| **Automated Validation Gate** | `IMPLEMENTED` | Executes sandbox pipeline (`install -> test -> lint -> typecheck -> build`) and checks exit codes before allowing transition to review or PR creation. |
| **Git Branch & PR Automation** | `IMPLEMENTED` | Creates isolated repair branch (`ai-repair/*`), commits sandbox patch, opens GitHub Pull Request, and attaches Vercel Preview. |
| **Human Production Approval Gate** | `IMPLEMENTED` | AI is strictly blocked from merging or deploying to production. Requires explicit human authorization from an `owner` or authorized `admin`. |
| **Project Memory Layer** | `IMPLEMENTED` | Scoped multi-tenant database memory implementation (`DatabaseMemoryProvider`) with organization/project/environment isolation, and adapter boundary ready for TencentDB Agent Memory (`TencentAgentMemoryProvider`). |
| **Immutable Audit Logging** | `IMPLEMENTED` | Server-side structured audit recorder with automatic secret redaction and database-level trigger protection against update/delete operations. |
| **Workflow Orchestration** | `IMPLEMENTED` | Trigger.dev background task definitions (`processSentryIncidentTask`, `workspaceLifecycleTask`, `validationPipelineTask`, `workspaceCleanupTask`). |
| **Usage & Cost Tracking** | `PARTIAL` | TTL auto-shutdown and output truncation implemented; full usage metering tables prepared for future commercial billing milestone. |

---

## 3. External Services Requiring Configuration

*To run against real cloud providers, configure credentials in `.env.local` (see `.env.example`):*

1. **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
2. **GitHub App**: `GITHUB_APP_ID`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_WEBHOOK_SECRET`
3. **Vercel & Sandbox**: `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_SANDBOX_TOKEN`
4. **Sentry**: `SENTRY_WEBHOOK_SECRET`
5. **OpenRouter**: `OPENROUTER_API_KEY`
6. **Trigger.dev**: `TRIGGER_SECRET_KEY`
7. **OpenHands**: `OPENHANDS_API_URL`, `OPENHANDS_API_KEY` (optional)
8. **TencentDB Agent Memory**: `TENCENT_AGENT_MEMORY_SECRET_ID`, `TENCENT_AGENT_MEMORY_SECRET_KEY` (Phase 2)

*Note: All providers include offline fallback implementations and mock adapters so that all unit tests, integration tests, and local builds run 100% deterministically without requiring external API keys.*

---

## 4. Important Routes

### User Interface Routes (Next.js App Router)
- `/[orgSlug]` - Main Dashboard Overview (OneDealer, YAKA, open incidents, active sandboxes)
- `/[orgSlug]/projects` - Connected Projects List
- `/[orgSlug]/projects/new` - Connect GitHub App & configure sandbox execution commands
- `/[orgSlug]/projects/[projectSlug]` - Project Overview, deployments, and incidents
- `/[orgSlug]/projects/[projectSlug]/incidents/[incidentId]` - Incident detail, stack trace viewer, and AI Diagnosis
- `/[orgSlug]/workspaces` - Active and past repair sandboxes
- `/[orgSlug]/workspaces/[workspaceId]` - Interactive Repair Workspace (AI Fix, Diff review, Allowlisted Terminal, Validation pipeline, PR creation, and Human Approval gate)
- `/[orgSlug]/incidents` - Cross-project incident stream
- `/[orgSlug]/deployments` - Production releases and Vercel preview environments
- `/[orgSlug]/team` - Team members & RBAC roles (`owner`, `admin`, `engineer`, `viewer`)
- `/[orgSlug]/audit` - Immutable security audit trail
- `/[orgSlug]/settings` - Organization & integrations configuration

### API Endpoints
- `POST /api/webhooks/sentry` - Sentry webhook receiver with HMAC-SHA256 verification and sanitization
- `POST /api/webhooks/github` - GitHub App webhook receiver with HMAC-SHA256 verification
- `GET, POST /api/projects` - List and create projects
- `POST /api/workspaces/[workspaceId]/commands` - Execute allowlisted command inside sandbox
- `POST /api/workspaces/[workspaceId]/analyze` - Run structured AI root cause analysis
- `POST /api/workspaces/[workspaceId]/repair` - Generate and apply surgical patch via OpenHands
- `POST /api/workspaces/[workspaceId]/validate` - Run automated validation pipeline
- `POST /api/workspaces/[workspaceId]/pr` - Create Git repair branch & Pull Request
- `POST /api/workspaces/[workspaceId]/approve` - Human Production Approval Gate (requires Owner/Admin)
- `POST /api/workspaces/[workspaceId]/stop` - Terminate sandbox workspace
- `GET /api/health` - Service health status

---

## 5. Database Migrations (in execution order)

1. [`supabase/migrations/00001_initial_schema.sql`](supabase/migrations/00001_initial_schema.sql): Organizations, members, projects, integrations, incidents, workspaces, analyses, command runs, PRs, deployments, and audit events.
2. [`supabase/migrations/00002_rls_policies.sql`](supabase/migrations/00002_rls_policies.sql): Row Level Security policies enforcing tenant isolation and role permissions.
3. [`supabase/migrations/00003_audit_triggers.sql`](supabase/migrations/00003_audit_triggers.sql): Immutability trigger on `audit_events` and automatic `updated_at` triggers.
4. [`supabase/migrations/00004_project_memory.sql`](supabase/migrations/00004_project_memory.sql): Scoped Project Memory schema.
5. [`supabase/seed.sql`](supabase/seed.sql): Local test fixtures (Acme Corp, OneDealer, YAKA, test incident).

---

## 6. Test & Build Execution Results

### Automated Test Suite (`npm test`)
- **Command**: `vitest run`
- **Result**: `✓ 13 test files passed (40 tests passed)`
- **Duration**: `3.81s`

| Test File | Tests | Result |
|---|---|---|
| `tests/unit/security/redaction.test.ts` | 7 | PASS |
| `tests/unit/security/allowlist.test.ts` | 5 | PASS |
| `tests/unit/security/signature.test.ts` | 4 | PASS |
| `tests/unit/security/branch-guard.test.ts` | 4 | PASS |
| `tests/unit/rbac/permissions.test.ts` | 4 | PASS |
| `tests/unit/state-machine/workspace-state.test.ts` | 5 | PASS |
| `tests/unit/providers/sentry.test.ts` | 1 | PASS |
| `tests/unit/providers/openrouter.test.ts` | 3 | PASS |
| `tests/unit/providers/openhands.test.ts` | 1 | PASS |
| `tests/unit/memory/memory.test.ts` | 1 | PASS |
| `tests/integration/tenant-isolation.test.ts` | 3 | PASS |
| `tests/integration/validation-gate.test.ts` | 1 | PASS |
| `tests/integration/pr-approval-flow.test.ts` | 1 | PASS |

### TypeScript Typecheck (`npm run typecheck`)
- **Command**: `tsc --noEmit`
- **Result**: `Exited with code 0 (0 errors)`

### Production Build (`npm run build`)
- **Command**: `next build`
- **Result**: `✓ Compiled successfully in 41s (All 8 static routes and dynamic API endpoints generated with 0 errors)`

---

## 7. Known Limitations & Production Placeholders

1. **In-Memory Store for Offline Mode**: `src/lib/supabase/server.ts` includes an `InMemoryDatabase` instance used during unit testing and local development when live Supabase credentials are not connected. In production, Supabase PostgreSQL with RLS is the persistent store.
2. **Deterministic Mock Providers**: `MockGitProvider` and `MockSandboxProvider` are provided for test environments. When real environment variables (`GITHUB_APP_ID`, `VERCEL_SANDBOX_TOKEN`, etc.) are configured, the platform uses `GitHubAppProvider` and `VercelSandboxProvider`.
3. **TencentDB Agent Memory**: The memory layer abstraction (`ProjectMemoryProvider`) is fully implemented with PostgreSQL storage; `TencentAgentMemoryProvider` is structured as an adapter ready for Phase 2 API connection.
4. **code-server Gateway**: The platform generates signed proxy session URLs for `code-server`; production deployment requires deploying the `code-server` container in the sandbox cluster behind your base domain.

---

## 8. Security-Specific Pre-Audit Inspection Summary

- **Cross-Tenant Access & IDOR**: Protected. Every database table has RLS policies linked to `auth.uid()`, and server services execute `AuthGuard.assertPermission()`.
- **Secret Redaction**: Redaction engine tests verify masking across Bearer tokens, JWTs, Stripe keys, GitHub tokens, Vercel keys, AWS keys, database passwords, and cookies.
- **Command Allowlisting & Shell Injection**: Commands are tokenized, checked against safe binaries (`npm`, `git`, `npx`, `tsc`), and reject metacharacters (`;`, `&&`, `|`, `` ` ``, redirects).
- **Protected Branch Defense**: Automated repairs cannot target `main`, `master`, `production`, `prod`, `release`, or `staging`.
- **Human Production Gate**: Merging to production requires an explicit owner/admin authorization step and records an immutable audit log. AI auto-merging is impossible by design.
