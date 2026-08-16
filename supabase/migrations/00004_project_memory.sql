-- ==============================================================================
-- Migration 00004: Project Memory (Internal Scoped Storage & TencentDB Adapter Layer)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.project_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    environment TEXT NOT NULL DEFAULT 'production',
    memory_type TEXT NOT NULL CHECK (memory_type IN ('architecture', 'convention', 'database_contract', 'past_repair', 'skill', 'deployment_rule')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_memories_proj ON public.project_memories(project_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_project_memories_org ON public.project_memories(organization_id);

ALTER TABLE public.project_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view project memories"
    ON public.project_memories FOR SELECT
    USING (public.is_org_member(organization_id, 'viewer'));

CREATE POLICY "Engineers can manage project memories"
    ON public.project_memories FOR ALL
    USING (public.is_org_member(organization_id, 'engineer'));

DROP TRIGGER IF EXISTS trg_memories_updated_at ON public.project_memories;
CREATE TRIGGER trg_memories_updated_at BEFORE UPDATE ON public.project_memories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();
