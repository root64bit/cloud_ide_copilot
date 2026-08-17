# Real Architecture Implementation Changes (Option B)

This document details the architectural transition from simulated/in-memory patterns to production-grade cloud integrations across the Cloud IDE Copilot platform.

---

## 1. Database Persistence Layer (`Supabase` & `PostgreSQL`)

- **Table Schemas**: Added `repair_artifacts` table schema to [`src/lib/supabase/types.ts`](file:///c:/Users/IBZ/Downloads/cloud_ide_copilot/src/lib/supabase/types.ts) with full CRUD row interfaces.
- **Repository Architecture**: Created [`src/lib/supabase/repositories.ts`](file:///c:/Users/IBZ/Downloads/cloud_ide_copilot/src/lib/supabase/repositories.ts) containing isolated, typed repositories:
  - `OrganizationRepo`
  - `OrganizationMemberRepo`
  - `ProjectRepo`
  - `IncidentRepo`
  - `WorkspaceRepo`
  - `RepairArtifactRepo`
  - `CommandRunRepo`
  - `PullRequestRepo`
  - `DeploymentRepo`
  - `AuditEventRepo`
- **Mock / Offline Fallback**: Implemented automatic detection (`isTestingOrMock()`) so that offline vitest suites run deterministically without requiring live Supabase credentials, while production API routes utilize the live Supabase client.

---

## 2. Authentication & Tenant Isolation (`AuthGuard` & `getAuthenticatedUser`)

- **Auth Resolution Helper**: Created [`src/lib/supabase/auth.ts`](file:///c:/Users/IBZ/Downloads/cloud_ide_copilot/src/lib/supabase/auth.ts) providing:
  - `getAuthenticatedUser(request)`
  - `requireOrganizationMembership(userId, organizationId)`
  - `assertTenantAccess(request, organizationId)`
- **RBAC Matrix Enforcement**: Fixed permissions checking to strictly use `deployment:approve_production` and `deployment:merge_pr` for human production release gate authorization.

---

## 3. Real Vercel Sandbox Provider (`@vercel/sandbox`)

- **SDK Integration**: Upgraded [`src/server/providers/sandbox/vercel-sandbox.provider.ts`](file:///c:/Users/IBZ/Downloads/cloud_ide_copilot/src/server/providers/sandbox/vercel-sandbox.provider.ts) to utilize `@vercel/sandbox` MicroVMs.
- **Secure Repository Clone**: Implemented Git cloning using short-lived GitHub App tokens with immediate credential scrubbing from Git remotes (`git remote set-url origin ...`).
- **Patch Application**: Implemented `applyPatch()` using dry-run validation (`git apply --check`) followed by application and temporary patch file removal.
- **Allowlisted Execution**: Command execution with secret redaction and process exit code tracking.

---

## 4. Deterministic Validation Pipeline

- **Validation Service**: Updated [`src/server/services/validation.service.ts`](file:///c:/Users/IBZ/Downloads/cloud_ide_copilot/src/server/services/validation.service.ts) to execute `install -> test -> lint -> typecheck -> build` inside the sandbox.
- **Validation Route**: Replaced the 503 placeholder in [`src/app/api/workspaces/[workspaceId]/validate/route.ts`](file:///c:/Users/IBZ/Downloads/cloud_ide_copilot/src/app/api/workspaces/[workspaceId]/validate/route.ts) with live `ValidationService` execution.

---

## 5. GitHub Pull Request & Human Approval Release Gate

- **GitHub App Provider**: Wired [`src/server/providers/git/github.provider.ts`](file:///c:/Users/IBZ/Downloads/cloud_ide_copilot/src/server/providers/git/github.provider.ts) with Octokit App token resolution.
- **Git PR Service**: Connected [`src/server/services/git-pr.service.ts`](file:///c:/Users/IBZ/Downloads/cloud_ide_copilot/src/server/services/git-pr.service.ts) to create repair branches, submit PRs, and enforce human approval before merging.
- **API Routes**:
  - [`src/app/api/workspaces/[workspaceId]/pr/route.ts`](file:///c:/Users/IBZ/Downloads/cloud_ide_copilot/src/app/api/workspaces/[workspaceId]/pr/route.ts)
  - [`src/app/api/workspaces/[workspaceId]/approve/route.ts`](file:///c:/Users/IBZ/Downloads/cloud_ide_copilot/src/app/api/workspaces/[workspaceId]/approve/route.ts)
  - [`src/app/api/workspaces/[workspaceId]/commands/route.ts`](file:///c:/Users/IBZ/Downloads/cloud_ide_copilot/src/app/api/workspaces/[workspaceId]/commands/route.ts)
  - [`src/app/api/workspaces/[workspaceId]/stop/route.ts`](file:///c:/Users/IBZ/Downloads/cloud_ide_copilot/src/app/api/workspaces/[workspaceId]/stop/route.ts)
  - [`src/app/api/webhooks/sentry/route.ts`](file:///c:/Users/IBZ/Downloads/cloud_ide_copilot/src/app/api/webhooks/sentry/route.ts)
