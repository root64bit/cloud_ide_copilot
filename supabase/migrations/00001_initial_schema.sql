-- ==============================================================================
-- Migration 00001: Initial Multi-Tenant Schema
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization Members & RBAC
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'engineer', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    repository_provider TEXT NOT NULL DEFAULT 'github',
    repository_owner TEXT NOT NULL,
    repository_name TEXT NOT NULL,
    repository_id BIGINT,
    default_branch TEXT NOT NULL DEFAULT 'main',
    deployment_provider TEXT NOT NULL DEFAULT 'vercel',
    vercel_project_id TEXT,
    vercel_team_id TEXT,
    production_domain TEXT,
    package_manager TEXT NOT NULL DEFAULT 'npm',
    install_command TEXT NOT NULL DEFAULT 'npm ci',
    test_command TEXT NOT NULL DEFAULT 'npm test',
    lint_command TEXT NOT NULL DEFAULT 'npm run lint',
    typecheck_command TEXT NOT NULL DEFAULT 'npx tsc --noEmit',
    build_command TEXT NOT NULL DEFAULT 'npm run build',
    dev_command TEXT NOT NULL DEFAULT 'npm run dev',
    dev_port INTEGER NOT NULL DEFAULT 3000,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'paused')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);

-- Project Integrations
CREATE TABLE IF NOT EXISTS public.project_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('github', 'vercel', 'sentry', 'openrouter', 'openhands')),
    external_id TEXT NOT NULL,
    config_encrypted JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, provider)
);

-- Incidents (e.g. Sentry error events)
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'sentry',
    external_issue_id TEXT NOT NULL,
    external_event_id TEXT,
    title TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'error' CHECK (level IN ('fatal', 'error', 'warning', 'info')),
    environment TEXT NOT NULL DEFAULT 'production',
    release TEXT,
    commit_sha TEXT,
    culprit TEXT,
    status TEXT NOT NULL DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'investigating', 'repairing', 'resolved', 'ignored')),
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    sanitized_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Repair Workspaces (Isolated sandboxes)
CREATE TABLE IF NOT EXISTS public.repair_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
    sandbox_provider TEXT NOT NULL DEFAULT 'vercel_sandbox',
    sandbox_id TEXT,
    sandbox_name TEXT NOT NULL,
    base_commit_sha TEXT NOT NULL,
    repair_branch TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'creating' CHECK (status IN (
        'creating', 'cloning', 'ready', 'analyzing', 'repairing',
        'validating', 'validation_failed', 'ready_for_review',
        'pr_created', 'preview_building', 'preview_ready',
        'approved', 'rejected', 'merged', 'completed', 'failed', 'stopped', 'expired'
    )),
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    stopped_at TIMESTAMPTZ
);

-- AI Analyses (Structured diagnosis & repair proposals)
CREATE TABLE IF NOT EXISTS public.ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.repair_workspaces(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'openrouter',
    model TEXT NOT NULL,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('incident_diagnosis', 'repair_plan', 'risk_review', 'test_generation')),
    structured_result JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Command Runs (Executed in Sandbox)
CREATE TABLE IF NOT EXISTS public.command_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.repair_workspaces(id) ON DELETE CASCADE,
    command_type TEXT NOT NULL CHECK (command_type IN ('install', 'test', 'lint', 'typecheck', 'build', 'git_status', 'git_diff', 'dev', 'custom_allowlisted')),
    command_display TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'passed', 'failed')),
    exit_code INTEGER,
    stdout_excerpt TEXT,
    stderr_excerpt TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    triggered_by UUID NOT NULL
);

-- Pull Requests
CREATE TABLE IF NOT EXISTS public.pull_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.repair_workspaces(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'github',
    repository_id BIGINT,
    external_pr_id TEXT,
    number INTEGER NOT NULL,
    url TEXT NOT NULL,
    branch TEXT NOT NULL,
    base_branch TEXT NOT NULL DEFAULT 'main',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'merged', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    merged_at TIMESTAMPTZ,
    merged_by UUID
);

-- Deployments (Production & Vercel Preview)
CREATE TABLE IF NOT EXISTS public.deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.repair_workspaces(id) ON DELETE SET NULL,
    provider TEXT NOT NULL DEFAULT 'vercel',
    external_deployment_id TEXT NOT NULL,
    environment TEXT NOT NULL DEFAULT 'preview' CHECK (environment IN ('production', 'preview', 'staging')),
    branch TEXT NOT NULL,
    commit_sha TEXT NOT NULL,
    url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('building', 'ready', 'error', 'canceled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ready_at TIMESTAMPTZ
);

-- Audit Events (Immutable logging)
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES public.repair_workspaces(id) ON DELETE SET NULL,
    user_id UUID,
    event_type TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-performance multi-tenant querying
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_incidents_project ON public.incidents(project_id);
CREATE INDEX IF NOT EXISTS idx_incidents_org ON public.incidents(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_project ON public.repair_workspaces(project_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_org ON public.repair_workspaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_status ON public.repair_workspaces(status);
CREATE INDEX IF NOT EXISTS idx_command_runs_workspace ON public.command_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_org ON public.audit_events(organization_id, created_at DESC);
