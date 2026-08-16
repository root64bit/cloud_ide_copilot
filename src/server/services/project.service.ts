import { AuditLogger } from "@/lib/audit/logger";
import { NotFoundError } from "@/lib/errors";
import { InMemoryDatabase } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/lib/supabase/types";
import { AuthGuard } from "../rbac/guard";

export interface CreateProjectInput {
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  repositoryOwner: string;
  repositoryName: string;
  repositoryId?: number;
  defaultBranch?: string;
  vercelProjectId?: string;
  vercelTeamId?: string;
  productionDomain?: string;
  packageManager?: string;
  installCommand?: string;
  testCommand?: string;
  lintCommand?: string;
  typecheckCommand?: string;
  buildCommand?: string;
  devCommand?: string;
  devPort?: number;
}

export class ProjectService {
  public static async createProject(userId: string, input: CreateProjectInput) {
    // Assert user has project:create permission
    await AuthGuard.assertPermission(userId, input.organizationId, "project:create");

    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const project = {
      id: projectId,
      organization_id: input.organizationId,
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      repository_provider: "github",
      repository_owner: input.repositoryOwner,
      repository_name: input.repositoryName,
      repository_id: input.repositoryId || null,
      default_branch: input.defaultBranch || "main",
      deployment_provider: "vercel",
      vercel_project_id: input.vercelProjectId || null,
      vercel_team_id: input.vercelTeamId || null,
      production_domain: input.productionDomain || null,
      package_manager: input.packageManager || "npm",
      install_command: input.installCommand || "npm ci",
      test_command: input.testCommand || "npm test",
      lint_command: input.lintCommand || "npm run lint",
      typecheck_command: input.typecheckCommand || "npx tsc --noEmit",
      build_command: input.buildCommand || "npm run build",
      dev_command: input.devCommand || "npm run dev",
      dev_port: input.devPort || 3000,
      status: "active" as ProjectStatus,
      created_at: now,
      updated_at: now,
    };

    InMemoryDatabase.getInstance().projects.set(projectId, project);

    await AuditLogger.log({
      organizationId: input.organizationId,
      projectId,
      userId,
      eventType: "project.created",
      metadata: { projectName: input.name, repo: `${input.repositoryOwner}/${input.repositoryName}` },
    });

    return project;
  }

  public static async getProject(userId: string, organizationId: string, projectIdOrSlug: string) {
    await AuthGuard.assertPermission(userId, organizationId, "project:view");

    const all = Array.from(InMemoryDatabase.getInstance().projects.values());
    const project = all.find(
      (p) =>
        p.organization_id === organizationId &&
        (p.id === projectIdOrSlug || p.slug === projectIdOrSlug)
    );

    if (!project) {
      throw new NotFoundError("Project", projectIdOrSlug);
    }

    return project;
  }

  public static async listProjects(userId: string, organizationId: string) {
    await AuthGuard.assertPermission(userId, organizationId, "project:view");

    const all = Array.from(InMemoryDatabase.getInstance().projects.values());
    return all.filter((p) => p.organization_id === organizationId);
  }
}
