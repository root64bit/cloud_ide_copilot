import { createAdminClient, InMemoryDatabase } from "./server";
import type { Database, UserRole, WorkspaceStatus } from "./types";

function isTestingOrMock(): boolean {
  return process.env.NODE_ENV === "test" || (process.env.NODE_ENV !== "production" && process.env.ALLOW_MOCK_PROVIDERS === "true");
}

function getDb(): any {
  return createAdminClient();
}

// -----------------------------------------------------------------------------
// Organization Repository
// -----------------------------------------------------------------------------
export class OrganizationRepo {
  static async findById(id: string) {
    if (isTestingOrMock()) {
      return InMemoryDatabase.getInstance().organizations.get(id) || null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async findBySlug(slug: string) {
    if (isTestingOrMock()) {
      for (const org of InMemoryDatabase.getInstance().organizations.values()) {
        if (org.slug === slug) return org;
      }
      return null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async list() {
    if (isTestingOrMock()) {
      return Array.from(InMemoryDatabase.getInstance().organizations.values());
    }
    const supabase = getDb();
    const { data, error } = await supabase.from("organizations").select("*");
    if (error) throw error;
    return data || [];
  }

  static async listByIds(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (uniqueIds.length === 0) return [];
    if (isTestingOrMock()) {
      return uniqueIds
        .map((id) => InMemoryDatabase.getInstance().organizations.get(id))
        .filter(Boolean);
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .in("id", uniqueIds)
      .order("name", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async create(data: Database["public"]["Tables"]["organizations"]["Insert"]) {
    const id = data.id || crypto.randomUUID();
    const row = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (isTestingOrMock()) {
      InMemoryDatabase.getInstance().organizations.set(id, row);
      return row;
    }
    const supabase = getDb();
    const { data: created, error } = await supabase
      .from("organizations")
      .insert(row as any)
      .select()
      .single();
    if (error) throw error;
    return created;
  }

  static async deleteById(id: string) {
    if (isTestingOrMock()) {
      return InMemoryDatabase.getInstance().organizations.delete(id);
    }
    const supabase = getDb();
    const { error } = await supabase.from("organizations").delete().eq("id", id);
    if (error) throw error;
    return true;
  }
}

// -----------------------------------------------------------------------------
// Organization Member Repository
// -----------------------------------------------------------------------------
export class OrganizationMemberRepo {
  static async getMembership(organizationId: string, userId: string): Promise<{ id: string; organization_id: string; user_id: string; role: UserRole; created_at: string } | null> {
    if (isTestingOrMock()) {
      const key = `${organizationId}:${userId}`;
      const found = InMemoryDatabase.getInstance().members.get(key);
      if (found) return found;
      // Fallback matching
      for (const mem of InMemoryDatabase.getInstance().members.values()) {
        if (mem.organization_id === organizationId && mem.user_id === userId) return mem;
      }
      return null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data as any;
  }

  static async listByUser(userId: string) {
    if (isTestingOrMock()) {
      return Array.from(InMemoryDatabase.getInstance().members.values()).filter(
        (m) => m.user_id === userId
      );
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("organization_members")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return data || [];
  }

  static async listByOrg(organizationId: string) {
    if (isTestingOrMock()) {
      return Array.from(InMemoryDatabase.getInstance().members.values()).filter(
        (m) => m.organization_id === organizationId
      );
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId);
    if (error) throw error;
    return data || [];
  }

  static async create(data: Database["public"]["Tables"]["organization_members"]["Insert"]) {
    const id = data.id || `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const row = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (isTestingOrMock()) {
      InMemoryDatabase.getInstance().members.set(`${data.organization_id}:${data.user_id}`, row);
      return row;
    }
    const supabase = getDb();
    const { data: created, error } = await supabase
      .from("organization_members")
      .insert(row as any)
      .select()
      .single();
    if (error) throw error;
    return created;
  }
}

// -----------------------------------------------------------------------------
// Project Repository
// -----------------------------------------------------------------------------
export class ProjectRepo {
  static async findByIdAny(id: string) {
    if (isTestingOrMock()) {
      return InMemoryDatabase.getInstance().projects.get(id) || null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async findById(organizationId: string, id: string) {
    if (isTestingOrMock()) {
      const proj = InMemoryDatabase.getInstance().projects.get(id);
      return proj && proj.organization_id === organizationId ? proj : null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async findBySlug(organizationId: string, slug: string) {
    if (isTestingOrMock()) {
      for (const proj of InMemoryDatabase.getInstance().projects.values()) {
        if (proj.organization_id === organizationId && proj.slug === slug) return proj;
      }
      return null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async findByRepo(repositoryOwner: string, repositoryName: string) {
    if (isTestingOrMock()) {
      for (const proj of InMemoryDatabase.getInstance().projects.values()) {
        if (
          proj.repository_owner.toLowerCase() === repositoryOwner.toLowerCase() &&
          proj.repository_name.toLowerCase() === repositoryName.toLowerCase()
        ) {
          return proj;
        }
      }
      return null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .ilike("repository_owner", repositoryOwner)
      .ilike("repository_name", repositoryName)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async listByOrg(organizationId: string) {
    if (isTestingOrMock()) {
      return Array.from(InMemoryDatabase.getInstance().projects.values()).filter(
        (p) => p.organization_id === organizationId
      );
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("organization_id", organizationId);
    if (error) throw error;
    return data || [];
  }

  static async create(data: Database["public"]["Tables"]["projects"]["Insert"]) {
    const id = data.id || crypto.randomUUID();
    const row = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (isTestingOrMock()) {
      InMemoryDatabase.getInstance().projects.set(id, row);
      return row;
    }
    const supabase = getDb();
    const { data: created, error } = await supabase
      .from("projects")
      .insert(row as any)
      .select()
      .single();
    if (error) throw error;
    return created;
  }
}

// -----------------------------------------------------------------------------
// Project Integration Repository
// -----------------------------------------------------------------------------
export class ProjectIntegrationRepo {
  static async findByProviderExternalId(provider: string, externalId: string) {
    if (isTestingOrMock()) {
      for (const integration of InMemoryDatabase.getInstance().projectIntegrations.values()) {
        if (integration.provider === provider && String(integration.external_id) === String(externalId)) return integration;
      }
      return null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("project_integrations")
      .select("*")
      .eq("provider", provider)
      .eq("external_id", String(externalId))
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async findByProjectAndProvider(projectId: string, provider: string) {
    if (isTestingOrMock()) {
      return InMemoryDatabase.getInstance().projectIntegrations.get(`${projectId}:${provider}`) || null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("project_integrations")
      .select("*")
      .eq("project_id", projectId)
      .eq("provider", provider)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async upsert(data: Database["public"]["Tables"]["project_integrations"]["Insert"]) {
    const id = data.id || crypto.randomUUID();
    const row = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (isTestingOrMock()) {
      InMemoryDatabase.getInstance().projectIntegrations.set(`${data.project_id}:${data.provider}`, row);
      return row;
    }
    const supabase = getDb();
    const { data: saved, error } = await supabase
      .from("project_integrations")
      .upsert(row as any, { onConflict: "project_id,provider" })
      .select()
      .single();
    if (error) throw error;
    return saved;
  }
}

// -----------------------------------------------------------------------------
// Incident Repository
// -----------------------------------------------------------------------------
export class IncidentRepo {
  static async findByIdAny(id: string) {
    if (isTestingOrMock()) {
      return InMemoryDatabase.getInstance().incidents.get(id) || null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async findById(organizationId: string, id: string) {
    if (isTestingOrMock()) {
      const inc = InMemoryDatabase.getInstance().incidents.get(id);
      return inc && inc.organization_id === organizationId ? inc : null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async findByExternalIssueId(projectId: string, externalIssueId: string) {
    if (isTestingOrMock()) {
      for (const inc of InMemoryDatabase.getInstance().incidents.values()) {
        if (inc.project_id === projectId && inc.external_issue_id === externalIssueId) {
          return inc;
        }
      }
      return null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("project_id", projectId)
      .eq("external_issue_id", externalIssueId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async listByOrg(organizationId: string) {
    if (isTestingOrMock()) {
      return Array.from(InMemoryDatabase.getInstance().incidents.values()).filter(
        (i) => i.organization_id === organizationId
      );
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async listByProject(projectId: string) {
    if (isTestingOrMock()) {
      return Array.from(InMemoryDatabase.getInstance().incidents.values()).filter(
        (i) => i.project_id === projectId
      );
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async create(data: Database["public"]["Tables"]["incidents"]["Insert"]) {
    const id = data.id || crypto.randomUUID();
    const row = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (isTestingOrMock()) {
      InMemoryDatabase.getInstance().incidents.set(id, row);
      return row;
    }
    const supabase = getDb();
    const { data: created, error } = await supabase
      .from("incidents")
      .insert(row as any)
      .select()
      .single();
    if (error) throw error;
    return created;
  }

  static async update(organizationId: string, id: string, updates: Database["public"]["Tables"]["incidents"]["Update"]) {
    if (isTestingOrMock()) {
      const existing = InMemoryDatabase.getInstance().incidents.get(id);
      if (!existing || existing.organization_id !== organizationId) return null;
      const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
      InMemoryDatabase.getInstance().incidents.set(id, updated);
      return updated;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("incidents")
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq("organization_id", organizationId)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// -----------------------------------------------------------------------------
// Workspace Repository
// -----------------------------------------------------------------------------
export class WorkspaceRepo {
  static async findByIdAny(id: string) {
    if (isTestingOrMock()) {
      return InMemoryDatabase.getInstance().workspaces.get(id) || null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("repair_workspaces")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async findById(organizationId: string, id: string) {
    if (isTestingOrMock()) {
      const ws = InMemoryDatabase.getInstance().workspaces.get(id);
      return ws && ws.organization_id === organizationId ? ws : null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("repair_workspaces")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async listByOrg(organizationId: string) {
    if (isTestingOrMock()) {
      return Array.from(InMemoryDatabase.getInstance().workspaces.values()).filter(
        (w) => w.organization_id === organizationId
      );
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("repair_workspaces")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async listByProject(projectId: string) {
    if (isTestingOrMock()) {
      return Array.from(InMemoryDatabase.getInstance().workspaces.values()).filter(
        (w) => w.project_id === projectId
      );
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("repair_workspaces")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async create(data: Database["public"]["Tables"]["repair_workspaces"]["Insert"]) {
    const id = data.id || `ws_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const row = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    };
    if (isTestingOrMock()) {
      InMemoryDatabase.getInstance().workspaces.set(id, row);
      return row;
    }
    const supabase = getDb();
    const { data: created, error } = await supabase
      .from("repair_workspaces")
      .insert(row as any)
      .select()
      .single();
    if (error) throw error;
    return created;
  }

  static async updateStatus(organizationId: string, id: string, status: WorkspaceStatus) {
    if (isTestingOrMock()) {
      const existing = InMemoryDatabase.getInstance().workspaces.get(id);
      if (!existing || existing.organization_id !== organizationId) return null;
      const updated = {
        ...existing,
        status,
        last_activity_at: new Date().toISOString(),
        stopped_at: status === "stopped" ? new Date().toISOString() : existing.stopped_at,
      };
      InMemoryDatabase.getInstance().workspaces.set(id, updated);
      return updated;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("repair_workspaces")
      .update({
        status,
        last_activity_at: new Date().toISOString(),
        ...(status === "stopped" ? { stopped_at: new Date().toISOString() } : {}),
      } as any)
      .eq("organization_id", organizationId)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// -----------------------------------------------------------------------------
// AI Analysis Repository
// -----------------------------------------------------------------------------
export class AIAnalysisRepo {
  static async create(data: Database["public"]["Tables"]["ai_analyses"]["Insert"]) {
    const id = data.id || crypto.randomUUID();
    const row = { ...data, id, created_at: new Date().toISOString() };
    if (isTestingOrMock()) {
      InMemoryDatabase.getInstance().aiAnalyses.set(id, row);
      return row;
    }
    const supabase = getDb();
    const { data: created, error } = await supabase
      .from("ai_analyses")
      .insert(row as any)
      .select()
      .single();
    if (error) throw error;
    return created;
  }
}

// -----------------------------------------------------------------------------
// Repair Artifact Repository
// -----------------------------------------------------------------------------
export class RepairArtifactRepo {
  static async findByWorkspaceId(workspaceId: string) {
    if (isTestingOrMock()) {
      for (const artifact of (InMemoryDatabase.getInstance() as any).repairArtifacts?.values() || []) {
        if (artifact.workspace_id === workspaceId) return artifact;
      }
      return null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("repair_artifacts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async updateStatus(id: string, status: string, stats?: any) {
    if (isTestingOrMock()) {
      const db = InMemoryDatabase.getInstance() as any;
      const existing = db.repairArtifacts?.get(id);
      if (!existing) return null;
      const updated = { ...existing, status, ...(stats ? { stats: { ...(existing.stats || {}), ...stats } } : {}) };
      db.repairArtifacts.set(id, updated);
      return updated;
    }
    const supabase = getDb();
    const update: any = { status };
    if (stats) {
      const { data: existing, error: readError } = await supabase
        .from("repair_artifacts")
        .select("stats")
        .eq("id", id)
        .maybeSingle();
      if (readError) throw readError;
      update.stats = { ...((existing as any)?.stats || {}), ...stats };
    }
    const { data, error } = await supabase
      .from("repair_artifacts")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async create(data: Database["public"]["Tables"]["repair_artifacts"]["Insert"]) {
    const id = data.id || `art_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const row = {
      ...data,
      id,
      created_at: new Date().toISOString(),
    };
    if (isTestingOrMock()) {
      const db = InMemoryDatabase.getInstance() as any;
      if (!db.repairArtifacts) db.repairArtifacts = new Map<string, any>();
      db.repairArtifacts.set(id, row);
      return row;
    }
    const supabase = getDb();
    const { data: created, error } = await supabase
      .from("repair_artifacts")
      .insert(row as any)
      .select()
      .single();
    if (error) throw error;
    return created;
  }
}

// -----------------------------------------------------------------------------
// Command Run Repository
// -----------------------------------------------------------------------------
export class CommandRunRepo {
  static async listByWorkspace(workspaceId: string) {
    if (isTestingOrMock()) {
      return Array.from(InMemoryDatabase.getInstance().commandRuns.values()).filter(
        (c) => c.workspace_id === workspaceId
      );
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("command_runs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("started_at", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async create(data: Database["public"]["Tables"]["command_runs"]["Insert"]) {
    const id = data.id || `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const row = {
      ...data,
      id,
      started_at: new Date().toISOString(),
    };
    if (isTestingOrMock()) {
      InMemoryDatabase.getInstance().commandRuns.set(id, row);
      return row;
    }
    const supabase = getDb();
    const { data: created, error } = await supabase
      .from("command_runs")
      .insert(row as any)
      .select()
      .single();
    if (error) throw error;
    return created;
  }
}

// -----------------------------------------------------------------------------
// Pull Request Repository
// -----------------------------------------------------------------------------
export class PullRequestRepo {
  static async findByWorkspaceId(workspaceId: string) {
    if (isTestingOrMock()) {
      for (const pr of InMemoryDatabase.getInstance().pullRequests.values()) {
        if (pr.workspace_id === workspaceId) return pr;
      }
      return null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("pull_requests")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async create(data: Database["public"]["Tables"]["pull_requests"]["Insert"]) {
    const id = data.id || `pr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const row = {
      ...data,
      id,
      created_at: new Date().toISOString(),
    };
    if (isTestingOrMock()) {
      InMemoryDatabase.getInstance().pullRequests.set(id, row);
      return row;
    }
    const supabase = getDb();
    const { data: created, error } = await supabase
      .from("pull_requests")
      .insert(row as any)
      .select()
      .single();
    if (error) throw error;
    return created;
  }

  static async updateStatus(
    id: string,
    status: "open" | "merged" | "closed",
    mergedBy?: string,
    mergeCommitSha?: string
  ) {
    if (isTestingOrMock()) {
      const existing = InMemoryDatabase.getInstance().pullRequests.get(id);
      if (!existing) return null;
      const updated = {
        ...existing,
        status,
        ...(status === "merged"
          ? {
              merged_at: new Date().toISOString(),
              merged_by: mergedBy || null,
              merge_commit_sha: mergeCommitSha || existing.merge_commit_sha || null,
            }
          : {}),
      };
      InMemoryDatabase.getInstance().pullRequests.set(id, updated);
      return updated;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("pull_requests")
      .update({
        status,
        ...(status === "merged"
          ? {
              merged_at: new Date().toISOString(),
              merged_by: mergedBy || null,
              merge_commit_sha: mergeCommitSha || null,
            }
          : {}),
      } as any)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// -----------------------------------------------------------------------------
// Deployment Repository
// -----------------------------------------------------------------------------
export class DeploymentRepo {
  static async listByWorkspace(workspaceId: string) {
    if (isTestingOrMock()) {
      return Array.from(InMemoryDatabase.getInstance().deployments.values())
        .filter((deployment) => deployment.workspace_id === workspaceId)
        .sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at)));
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("deployments")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async findByExternalDeploymentId(externalDeploymentId: string) {
    if (isTestingOrMock()) {
      for (const deployment of InMemoryDatabase.getInstance().deployments.values()) {
        if (deployment.external_deployment_id === externalDeploymentId) return deployment;
      }
      return null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("deployments")
      .select("*")
      .eq("external_deployment_id", externalDeploymentId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async findByWorkspaceId(workspaceId: string) {
    if (isTestingOrMock()) {
      for (const dpl of InMemoryDatabase.getInstance().deployments.values()) {
        if (dpl.workspace_id === workspaceId) return dpl;
      }
      return null;
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("deployments")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async listByProject(projectId: string) {
    if (isTestingOrMock()) {
      return Array.from(InMemoryDatabase.getInstance().deployments.values()).filter(
        (d) => d.project_id === projectId
      );
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("deployments")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async create(data: Database["public"]["Tables"]["deployments"]["Insert"]) {
    const id = data.id || `dpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const row = {
      ...data,
      id,
      created_at: new Date().toISOString(),
    };
    if (isTestingOrMock()) {
      InMemoryDatabase.getInstance().deployments.set(id, row);
      return row;
    }
    const supabase = getDb();
    const { data: created, error } = await supabase
      .from("deployments")
      .insert(row as any)
      .select()
      .single();
    if (error) throw error;
    return created;
  }

  static async upsertByExternalId(data: Database["public"]["Tables"]["deployments"]["Insert"]) {
    const existing = await this.findByExternalDeploymentId(data.external_deployment_id);
    if (!existing) return this.create(data);

    if (isTestingOrMock()) {
      const updated = {
        ...existing,
        ...data,
        id: existing.id,
        created_at: existing.created_at,
      };
      InMemoryDatabase.getInstance().deployments.set(existing.id, updated as any);
      return updated;
    }

    const supabase = getDb();
    const { data: updated, error } = await supabase
      .from("deployments")
      .update({
        project_id: data.project_id,
        workspace_id: data.workspace_id ?? existing.workspace_id,
        provider: data.provider || existing.provider,
        environment: data.environment || existing.environment,
        branch: data.branch,
        commit_sha: data.commit_sha,
        url: data.url,
        status: data.status || existing.status,
        ready_at: data.ready_at ?? existing.ready_at,
      } as any)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  }
}

// -----------------------------------------------------------------------------
// Audit Event Repository
// -----------------------------------------------------------------------------
export class AuditEventRepo {
  static async listByOrg(organizationId: string, limit = 50) {
    if (isTestingOrMock()) {
      return InMemoryDatabase.getInstance()
        .auditEvents.filter((a) => a.organization_id === organizationId)
        .slice(0, limit);
    }
    const supabase = getDb();
    const { data, error } = await supabase
      .from("audit_events")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  static async create(data: Database["public"]["Tables"]["audit_events"]["Insert"]) {
    const id = data.id || crypto.randomUUID();
    const row = {
      ...data,
      id,
      created_at: new Date().toISOString(),
    };
    if (isTestingOrMock()) {
      InMemoryDatabase.getInstance().auditEvents.unshift(row);
      return row;
    }
    const supabase = getDb();
    const { data: created, error } = await supabase
      .from("audit_events")
      .insert(row as any)
      .select()
      .single();
    if (error) throw error;
    return created;
  }
}
