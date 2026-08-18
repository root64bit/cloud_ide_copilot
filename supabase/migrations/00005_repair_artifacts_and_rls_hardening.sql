-- ==============================================================================
-- Migration 00005: Repair artifacts + RLS helper hardening
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.repair_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.repair_workspaces(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
    provider TEXT NOT NULL DEFAULT 'openhands',
    conversation_id TEXT,
    sandbox_id TEXT,
    patch_content TEXT NOT NULL DEFAULT '',
    files_changed TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    stats JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repair_artifacts_workspace_created
    ON public.repair_artifacts(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_repair_artifacts_org
    ON public.repair_artifacts(organization_id, created_at DESC);

ALTER TABLE public.repair_artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view repair artifacts" ON public.repair_artifacts;
CREATE POLICY "Members can view repair artifacts"
    ON public.repair_artifacts FOR SELECT
    USING (
        public.is_org_member(organization_id, 'viewer')
        AND EXISTS (
            SELECT 1 FROM public.repair_workspaces w
            WHERE w.id = repair_artifacts.workspace_id
              AND w.organization_id = repair_artifacts.organization_id
              AND w.project_id = repair_artifacts.project_id
        )
    );

DROP POLICY IF EXISTS "Engineers can create repair artifacts" ON public.repair_artifacts;
CREATE POLICY "Engineers can create repair artifacts"
    ON public.repair_artifacts FOR INSERT
    WITH CHECK (
        public.is_org_member(organization_id, 'engineer')
        AND EXISTS (
            SELECT 1 FROM public.repair_workspaces w
            WHERE w.id = repair_artifacts.workspace_id
              AND w.organization_id = repair_artifacts.organization_id
              AND w.project_id = repair_artifacts.project_id
        )
    );

-- SECURITY DEFINER helpers must use a fixed search_path to prevent object-shadowing attacks.
CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID, required_role TEXT DEFAULT 'viewer')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.organization_members
    WHERE organization_id = target_org_id AND user_id = auth.uid();

    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;

    IF required_role = 'viewer' THEN
        RETURN TRUE;
    ELSIF required_role = 'engineer' THEN
        RETURN user_role IN ('owner', 'admin', 'engineer');
    ELSIF required_role = 'admin' THEN
        RETURN user_role IN ('owner', 'admin');
    ELSIF required_role = 'owner' THEN
        RETURN user_role = 'owner';
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;
