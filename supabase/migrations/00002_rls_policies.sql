-- ==============================================================================
-- Migration 00002: Row Level Security (RLS) & Multi-Tenant Isolation
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.command_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pull_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check Organization Membership
CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID, required_role TEXT DEFAULT 'viewer')
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1. Organizations Policies
CREATE POLICY "Users can view organizations they belong to"
    ON public.organizations FOR SELECT
    USING (public.is_org_member(id, 'viewer'));

CREATE POLICY "Authenticated users can create organizations"
    ON public.organizations FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Organization owners can update their organization"
    ON public.organizations FOR UPDATE
    USING (public.is_org_member(id, 'owner'));

CREATE POLICY "Organization owners can delete their organization"
    ON public.organizations FOR DELETE
    USING (public.is_org_member(id, 'owner'));

-- 2. Organization Members Policies
CREATE POLICY "Users can view members of their organizations"
    ON public.organization_members FOR SELECT
    USING (public.is_org_member(organization_id, 'viewer'));

CREATE POLICY "Organization admins/owners can manage members"
    ON public.organization_members FOR INSERT
    WITH CHECK (public.is_org_member(organization_id, 'admin'));

CREATE POLICY "Organization admins/owners can update members"
    ON public.organization_members FOR UPDATE
    USING (public.is_org_member(organization_id, 'admin'));

CREATE POLICY "Organization admins/owners can remove members"
    ON public.organization_members FOR DELETE
    USING (public.is_org_member(organization_id, 'admin'));

-- 3. Projects Policies
CREATE POLICY "Members can view projects in their organization"
    ON public.projects FOR SELECT
    USING (public.is_org_member(organization_id, 'viewer'));

CREATE POLICY "Engineers/Admins can create projects"
    ON public.projects FOR INSERT
    WITH CHECK (public.is_org_member(organization_id, 'engineer'));

CREATE POLICY "Engineers/Admins can update projects"
    ON public.projects FOR UPDATE
    USING (public.is_org_member(organization_id, 'engineer'));

CREATE POLICY "Admins/Owners can delete projects"
    ON public.projects FOR DELETE
    USING (public.is_org_member(organization_id, 'admin'));

-- 4. Project Integrations Policies
CREATE POLICY "Members can view project integrations"
    ON public.project_integrations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_integrations.project_id
        AND public.is_org_member(p.organization_id, 'viewer')
    ));

CREATE POLICY "Admins can manage project integrations"
    ON public.project_integrations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_integrations.project_id
        AND public.is_org_member(p.organization_id, 'admin')
    ));

-- 5. Incidents Policies
CREATE POLICY "Members can view incidents"
    ON public.incidents FOR SELECT
    USING (public.is_org_member(organization_id, 'viewer'));

CREATE POLICY "Engineers can manage incidents"
    ON public.incidents FOR ALL
    USING (public.is_org_member(organization_id, 'engineer'));

-- 6. Repair Workspaces Policies
CREATE POLICY "Members can view repair workspaces"
    ON public.repair_workspaces FOR SELECT
    USING (public.is_org_member(organization_id, 'viewer'));

CREATE POLICY "Engineers can create repair workspaces"
    ON public.repair_workspaces FOR INSERT
    WITH CHECK (public.is_org_member(organization_id, 'engineer') AND auth.uid() = created_by);

CREATE POLICY "Engineers can update repair workspaces"
    ON public.repair_workspaces FOR UPDATE
    USING (public.is_org_member(organization_id, 'engineer'));

-- 7. AI Analyses Policies
CREATE POLICY "Members can view AI analyses"
    ON public.ai_analyses FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.repair_workspaces w
        WHERE w.id = ai_analyses.workspace_id
        AND public.is_org_member(w.organization_id, 'viewer')
    ));

CREATE POLICY "Engineers can create AI analyses"
    ON public.ai_analyses FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.repair_workspaces w
        WHERE w.id = ai_analyses.workspace_id
        AND public.is_org_member(w.organization_id, 'engineer')
    ));

-- 8. Command Runs Policies
CREATE POLICY "Members can view command runs"
    ON public.command_runs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.repair_workspaces w
        WHERE w.id = command_runs.workspace_id
        AND public.is_org_member(w.organization_id, 'viewer')
    ));

CREATE POLICY "Engineers can create command runs"
    ON public.command_runs FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.repair_workspaces w
        WHERE w.id = command_runs.workspace_id
        AND public.is_org_member(w.organization_id, 'engineer')
    ));

-- 9. Pull Requests Policies
CREATE POLICY "Members can view pull requests"
    ON public.pull_requests FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.repair_workspaces w
        WHERE w.id = pull_requests.workspace_id
        AND public.is_org_member(w.organization_id, 'viewer')
    ));

CREATE POLICY "Engineers can create pull requests"
    ON public.pull_requests FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.repair_workspaces w
        WHERE w.id = pull_requests.workspace_id
        AND public.is_org_member(w.organization_id, 'engineer')
    ));

CREATE POLICY "Admins/Owners can update pull requests"
    ON public.pull_requests FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.repair_workspaces w
        WHERE w.id = pull_requests.workspace_id
        AND public.is_org_member(w.organization_id, 'admin')
    ));

-- 10. Deployments Policies
CREATE POLICY "Members can view deployments"
    ON public.deployments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = deployments.project_id
        AND public.is_org_member(p.organization_id, 'viewer')
    ));

CREATE POLICY "System and Admins can manage deployments"
    ON public.deployments FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = deployments.project_id
        AND public.is_org_member(p.organization_id, 'admin')
    ));

-- 11. Audit Events Policies (Append-only for users, immutable)
CREATE POLICY "Members can view audit events"
    ON public.audit_events FOR SELECT
    USING (public.is_org_member(organization_id, 'viewer'));

CREATE POLICY "System and authenticated users can insert audit events"
    ON public.audit_events FOR INSERT
    WITH CHECK (public.is_org_member(organization_id, 'viewer'));
