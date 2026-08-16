# System Architecture

The **AI Engineering Platform** (`engineering.example.com`) is a multi-tenant cloud-native copilot that bridges production error monitoring (Sentry), isolated execution environments (@vercel/sandbox), coding agents (OpenHands & OpenRouter), Git workflows (GitHub App), and Vercel preview/production deployments with mandatory human production approval gates.

---

## 1. High-Level Architecture Diagram

```text
+---------------------------------------------------------------------------------------------------+
|                                       WEB CLIENT / MOBILE                                         |
|                 (Responsive Next.js 15 App Router + Tailwind CSS + Lucide Icons)                  |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                       NEXT.JS SAAS PLATFORM                                       |
|  - Server-Side RBAC & Auth Guard (Owner, Admin, Engineer, Viewer)                                 |
|  - Immutable Audit Logger & Sanitized Event Stream                                                |
|  - Secret Redaction Engine (Zero secret leakage to logs, prompts, or client)                      |
|  - Webhook Gateways (/api/webhooks/sentry, /api/webhooks/github) with HMAC Verification           |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
        +-----------------------------------------+-----------------------------------------+
        |                                         |                                         |
        v                                         v                                         v
+-----------------------+       +-----------------------------------+       +-----------------------+
|  DATABASE & TENANCY   |       |       PROVIDER ABSTRACTIONS       |       | WORKFLOW ORCHESTRATOR |
|  - Supabase Auth      |       |  - GitProvider: GitHub App        |       |  - Trigger.dev Tasks  |
|  - PostgreSQL with RLS|       |  - DeploymentProvider: Vercel     |       |    * Sentry Ingestion |
|  - Multi-tenant Orgs  |       |  - IncidentProvider: Sentry       |       |    * Sandbox Lifecycle|
|  - Append-Only Audit  |       |  - AIProvider: OpenRouter         |       |    * OpenHands Repair |
|  - State Machines     |       |  - SandboxProvider: Vercel Sandbox|       |    * Validation Gate  |
|  - Memory Schema      |       |  - CodingAgent: OpenHands         |       |    * PR & Preview     |
+-----------------------+       |  - Memory: ProjectMemoryProvider  |       +-----------------------+
                                +-----------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                    ISOLATED EXECUTION SANDBOX                                     |
|  - Vercel Sandbox (@vercel/sandbox)                                                               |
|  - Strict Command Allowlist (install, test, lint, typecheck, build, git status, git diff)         |
|  - Zero Production Secrets (Strictly ephemeral staging/mock environments)                         |
|  - code-server Browser IDE Proxy Gateway                                                          |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Core Service Boundaries

### 2.1 Multi-Tenant Organizations & RBAC
- Every project, incident, workspace, deployment, and audit record is strictly partitioned by `organization_id`.
- Server-side RBAC enforces four distinct roles:
  - **Viewer**: Read-only access to projects, incidents, workspaces, deployments.
  - **Engineer**: Create workspaces, execute allowlisted sandbox commands, trigger AI diagnosis, apply patches, run validation pipelines, open repair PRs.
  - **Admin**: All engineer permissions + invite members, configure integrations, and authorize production merges.
  - **Owner**: Full access including billing, organization deletion, and production approval.

### 2.2 GitHub App Integration
- Utilizes GitHub App with short-lived installation access tokens.
- No personal access tokens or permanent credentials stored.
- Read-only operations for repository metadata and commit inspections; write operations strictly restricted to isolated repair branches (`ai-repair/*`).
- Direct pushes or commits to protected branches (`main`, `master`, `production`, `release`) are blocked server-side.

### 2.3 Vercel Sandbox & Browser IDE
- Isolated execution using `@vercel/sandbox`.
- Zero production secrets enter sandbox environments.
- Commands execute through a strict tokenized allowlist layer blocking shell injection vectors.
- Large command outputs are safely truncated and scrubbed of sensitive tokens.
- `code-server` provides browser-based VS Code editing scoped strictly to the sandbox workspace.

### 2.4 Sentry Webhook Ingestion
- Real-time ingestion via signed webhook (`/api/webhooks/sentry`).
- HMAC-SHA256 signature verification with timing-safe equality checks.
- Sanitization layer strips all `Authorization` headers, cookies, passwords, API keys, and personal identifiers before database persistence.

### 2.5 OpenRouter & OpenHands
- Structured JSON Schema outputs enforced via Zod (`IncidentDiagnosisSchema`, `RepairPlanSchema`, `RiskReviewSchema`).
- Multi-tier model routing (Analysis, Coding, Review, Fast/Triage).
- OpenHands agent coordinates repository investigation, code AST search, minimal patch generation, and test creation.

### 2.6 Validation Gate & Human Production Approval
- State Machine: `creating -> cloning -> ready -> analyzing -> repairing -> validating -> (validation_failed | ready_for_review) -> pr_created -> preview_ready -> approved -> merged -> completed`.
- Validation checks (`install`, `test`, `lint`, `typecheck`, `build`) must pass with exit code 0 before a PR can be reviewed.
- AI is strictly prohibited from merging or deploying to production.
- Human production approval requires explicit authorization from an owner or authorized admin.

### 2.7 Project Memory (TencentDB Agent Memory Ready)
- Scoped project memory storing architecture context, coding rules, and past bugfix patterns.
- Internal scoped database memory implementation with seamless adapter interface for TencentDB Agent Memory in Phase 2.
