# Setup & Configuration Guide (Cloud IDE Copilot)

This document lists all environment variables, credentials, and cloud provider settings required to operate the full real architecture.

---

## 1. Environment Variables (`.env.local` / Production)

```bash
# -----------------------------------------------------------------------------
# Supabase Persistence & Authentication
# -----------------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=https://iywhmgwzsgfzqrtrbujn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# -----------------------------------------------------------------------------
# OpenHands Cloud Integration
# -----------------------------------------------------------------------------
OPENHANDS_API_KEY=<your-openhands-api-key>
OPENHANDS_API_BASE_URL=https://app.all-hands.dev

# -----------------------------------------------------------------------------
# OpenRouter LLM Gateway
# -----------------------------------------------------------------------------
OPENROUTER_API_KEY=<your-openrouter-api-key>
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-sonnet

# -----------------------------------------------------------------------------
# Trigger.dev Background Orchestration
# -----------------------------------------------------------------------------
TRIGGER_SECRET_KEY=<your-trigger-secret-key>
TRIGGER_PROJECT_REF=proj_yrzkermulzkjpgxbkrsm

# -----------------------------------------------------------------------------
# Vercel Sandbox MicroVMs
# -----------------------------------------------------------------------------
VERCEL_SANDBOX_TOKEN=<your-vercel-sandbox-token>
CODE_SERVER_BASE_DOMAIN=ide.engineering.example.com

# -----------------------------------------------------------------------------
# GitHub App Configuration
# -----------------------------------------------------------------------------
GITHUB_APP_ID=4617223
GITHUB_APP_CLIENT_ID=Iv23limSg1sidM965VMv
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"

# -----------------------------------------------------------------------------
# Sentry Ingestion Webhooks
# -----------------------------------------------------------------------------
SENTRY_WEBHOOK_SECRET=<your-sentry-webhook-client-secret>
```

---

## 2. Supabase Database Migration

To apply the `repair_artifacts` table schema to your Supabase instance, execute the following SQL in the Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS public.repair_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id VARCHAR(255) NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  provider VARCHAR(64) NOT NULL DEFAULT 'openhands',
  conversation_id VARCHAR(255),
  sandbox_id VARCHAR(255),
  patch_content TEXT NOT NULL,
  files_changed JSONB NOT NULL DEFAULT '[]'::jsonb,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(64) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.repair_artifacts ENABLE ROW LEVEL SECURITY;

-- Organization-scoped access policy
CREATE POLICY "Users can view repair artifacts for their organization"
  ON public.repair_artifacts
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()::text
    )
  );
```

---

## 3. Running Locally & Testing

- Run unit & integration tests: `npm test`
- Check TypeScript types: `npm run typecheck`
- Start dev server: `npm run dev`
- Start Trigger.dev local worker: `npx trigger.dev dev`
