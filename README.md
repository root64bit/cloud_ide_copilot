# AI Engineering Platform (`engineering.example.com`)

Production-grade, multi-tenant **AI Engineering Platform** that connects GitHub repositories, monitors production errors from Sentry, launches isolated `@vercel/sandbox` execution environments, uses AI coding agents (OpenHands & OpenRouter) to diagnose and repair errors, runs automated validation checks, creates Git branches and PRs, tracks Vercel preview deployments, and enforces explicit human approval gates before production merges.

---

## Key Features

- **Multi-Tenant SaaS Foundation**: Organizations, projects, members, incidents, sandboxes, and immutable audit logs isolated with Supabase PostgreSQL Row Level Security (RLS).
- **Server-Side RBAC**: Granular permissions across `owner`, `admin`, `engineer`, and `viewer` roles.
- **GitHub App Architecture**: Short-lived installation tokens, protected branch defense (`main`, `master`, `production`), and automated repair branch management (`ai-repair/*`).
- **Isolated Execution Sandboxes**: Powered by `@vercel/sandbox` with tokenized command allowlisting and shell injection defense.
- **Sentry Webhook Ingestion**: Signed webhook receiver with timing-safe HMAC-SHA256 signature verification and sensitive data sanitization (stripping tokens, cookies, auth headers, and passwords).
- **Structured LLM Gateway**: OpenRouter integration with strict Zod validation schemas (`IncidentDiagnosisSchema`, `RepairPlanSchema`, `RiskReviewSchema`) and model routing.
- **OpenHands Coding Agent Bridge**: Autonomous repository investigation, code AST search, surgical patch proposal, and test generation.
- **Automated Validation Gate**: Enforces that `install`, `test`, `lint`, `typecheck`, and `build` exit with code 0 before review or PR creation.
- **Human Production Approval Gate**: AI cannot merge or deploy to production; requires explicit authorization from an owner or authorized admin.
- **code-server Browser IDE**: Temporary sandbox IDE connection scoped to isolated repair environments.
- **Trigger.dev Workflow Orchestration**: Background tasks for retryable incident processing, sandbox lifecycles, and cleanup.
- **Project Memory Ready**: Multi-tenant memory interface prepared for TencentDB Agent Memory in Phase 2.
- **Mobile-First UX**: Responsive interface designed for on-call triage, AI diagnosis, diff review, and PR approval directly from a phone.

---

## Technology Stack

- **Framework**: Next.js 15 (App Router, React 19, TypeScript strict mode)
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Triggers)
- **Git Integration**: GitHub App (`@octokit/app`, `@octokit/rest`)
- **Sandbox**: Vercel Sandbox (`@vercel/sandbox`) / `code-server`
- **Error Monitoring**: Sentry signed webhooks
- **LLM Gateway**: OpenRouter
- **Coding Agent**: OpenHands
- **Workflow Orchestration**: Trigger.dev
- **Testing**: Vitest

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## Documentation

Full architectural and operational documentation is available in `docs/`:
- [System Architecture](docs/architecture.md)
- [Security Model & Defense-in-Depth](docs/security-model.md)
- [Database Schema & Migrations](docs/database.md)
- [Provider Interfaces & Extensibility](docs/provider-interfaces.md)
- [GitHub App Setup](docs/github-setup.md)
- [Vercel & Preview Setup](docs/vercel-setup.md)
- [Sandbox & Browser IDE](docs/sandbox.md)
- [Local Development Guide](docs/local-development.md)
- [Production Deployment Guide](docs/deployment.md)
- [Environment Variables Reference](docs/environment-variables.md)
- [Testing & Verification](docs/testing.md)
- [Product Roadmap](docs/roadmap.md)
