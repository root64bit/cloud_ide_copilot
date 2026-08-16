# Database Schema & Migrations

The platform utilizes **Supabase (PostgreSQL)** with Row Level Security (RLS) for complete multi-tenant data isolation.

---

## 1. Schema Tables

### `organizations`
Primary multi-tenant unit.
- `id` (UUID, PK)
- `name` (TEXT)
- `slug` (TEXT, Unique)
- `created_by` (UUID)
- `created_at` / `updated_at` (TIMESTAMPTZ)

### `organization_members`
RBAC membership table.
- `id` (UUID, PK)
- `organization_id` (UUID, FK -> organizations.id)
- `user_id` (UUID)
- `role` (TEXT: `owner`, `admin`, `engineer`, `viewer`)
- `created_at` / `updated_at` (TIMESTAMPTZ)

### `projects`
Connected software projects (e.g. OneDealer, YAKA, casadepeneus).
- `id` (UUID, PK)
- `organization_id` (UUID, FK -> organizations.id)
- `name` (TEXT)
- `slug` (TEXT)
- `description` (TEXT)
- `repository_provider` (TEXT: `github`)
- `repository_owner` / `repository_name` (TEXT)
- `repository_id` (BIGINT)
- `default_branch` (TEXT)
- `deployment_provider` (TEXT: `vercel`)
- `vercel_project_id` / `vercel_team_id` (TEXT)
- `production_domain` (TEXT)
- `package_manager` (TEXT: `npm`, `pnpm`, `yarn`, `bun`)
- `install_command` / `test_command` / `lint_command` / `typecheck_command` / `build_command` / `dev_command` (TEXT)
- `dev_port` (INTEGER)
- `status` (TEXT: `active`, `archived`, `paused`)

### `incidents`
Production errors ingested from Sentry.
- `id` (UUID, PK)
- `organization_id` / `project_id` (UUID, FKs)
- `provider` (TEXT: `sentry`)
- `external_issue_id` / `external_event_id` (TEXT)
- `title` (TEXT)
- `level` (TEXT: `fatal`, `error`, `warning`, `info`)
- `environment` (TEXT: `production`, `staging`)
- `release` / `commit_sha` / `culprit` (TEXT)
- `status` (TEXT: `unresolved`, `investigating`, `repairing`, `resolved`, `ignored`)
- `occurrence_count` (INTEGER)
- `sanitized_metadata` (JSONB: stacktrace, tags, sanitized request)

### `repair_workspaces`
Ephemeral execution sandboxes.
- `id` (UUID, PK)
- `organization_id` / `project_id` / `incident_id` (UUID, FKs)
- `sandbox_provider` (TEXT: `vercel_sandbox`)
- `sandbox_id` / `sandbox_name` (TEXT)
- `base_commit_sha` (TEXT)
- `repair_branch` (TEXT)
- `status` (TEXT: `creating`, `cloning`, `ready`, `analyzing`, `repairing`, `validating`, `validation_failed`, `ready_for_review`, `pr_created`, `preview_building`, `preview_ready`, `approved`, `rejected`, `merged`, `completed`, `failed`, `stopped`, `expired`)
- `created_by` (UUID)
- `expires_at` / `stopped_at` (TIMESTAMPTZ)

### `command_runs`
Audit of commands executed in the sandbox.
- `id` (UUID, PK)
- `workspace_id` (UUID, FK -> repair_workspaces.id)
- `command_type` (TEXT: `install`, `test`, `lint`, `typecheck`, `build`, `git_status`, `git_diff`, `dev`, `custom_allowlisted`)
- `command_display` (TEXT)
- `status` (TEXT: `pending`, `running`, `passed`, `failed`)
- `exit_code` (INTEGER)
- `stdout_excerpt` / `stderr_excerpt` (TEXT: truncated & redacted)
- `started_at` / `completed_at` (TIMESTAMPTZ)
- `triggered_by` (UUID)

### `pull_requests`
Git Pull Requests opened by the platform.
- `id` (UUID, PK)
- `workspace_id` (UUID, FK -> repair_workspaces.id)
- `provider` (TEXT: `github`)
- `number` (INTEGER)
- `url` (TEXT)
- `branch` / `base_branch` (TEXT)
- `status` (TEXT: `open`, `merged`, `closed`)
- `merged_at` / `merged_by` (TIMESTAMPTZ / UUID)

### `deployments`
Deployments associated with preview/production branches.
- `id` (UUID, PK)
- `project_id` / `workspace_id` (UUID, FKs)
- `provider` (TEXT: `vercel`)
- `external_deployment_id` (TEXT)
- `environment` (TEXT: `production`, `preview`, `staging`)
- `branch` / `commit_sha` / `url` (TEXT)
- `status` (TEXT: `building`, `ready`, `error`, `canceled`)

### `audit_events`
Immutable security and operational event log.
- `id` (UUID, PK)
- `organization_id` / `project_id` / `workspace_id` (UUID)
- `user_id` (UUID)
- `event_type` (TEXT)
- `metadata` (JSONB)
- `ip_hash` (TEXT)
- `created_at` (TIMESTAMPTZ)

### `project_memories`
Scoped project architecture memory.
- `id` (UUID, PK)
- `organization_id` / `project_id` (UUID, FKs)
- `environment` (TEXT)
- `memory_type` (TEXT: `architecture`, `convention`, `database_contract`, `past_repair`, `skill`, `deployment_rule`)
- `title` / `content` (TEXT)
- `tags` (TEXT[])
- `metadata` (JSONB)

---

## 2. Row Level Security (RLS) Policies
- All tables enable RLS.
- Helper function `is_org_member(target_org_id, required_role)` queries `organization_members` with `auth.uid()`.
- Unaffiliated users cannot query, insert, or modify rows belonging to other tenants.

---

## 3. Database Triggers & Immutability
- Trigger `prevent_audit_log_modification()` raises an exception on `UPDATE` or `DELETE` on the `audit_events` table.
- Automatic timestamp update triggers (`set_updated_at_timestamp()`) on mutable entities.
