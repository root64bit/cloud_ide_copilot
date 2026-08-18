import { getAuthenticatedUser, requireOrganizationMembership } from "@/lib/supabase/auth";
import { IncidentRepo, ProjectIntegrationRepo, WorkspaceRepo } from "@/lib/supabase/repositories";
import { GitHubAppProvider } from "@/server/providers/git/github.provider";
import { VercelSandboxProvider } from "@/server/providers/sandbox/vercel-sandbox.provider";
import { ProjectService } from "@/server/services/project.service";
import { WorkspaceService } from "@/server/services/workspace.service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseInstallationId(value: unknown): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Connected GitHub installation is invalid");
  return id;
}

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const organizationId = new URL(req.url).searchParams.get("orgId");
    if (!organizationId) return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    await requireOrganizationMembership(user.id, organizationId);
    await ProjectService.listProjects(user.id, organizationId); // RBAC view check
    const workspaces = await WorkspaceRepo.listByOrg(organizationId);
    return NextResponse.json({ workspaces });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to list workspaces" }, { status: error?.statusCode || 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const organizationId = String(body.organizationId || "");
    const projectId = String(body.projectId || "");
    if (!organizationId || !projectId) {
      return NextResponse.json({ error: "organizationId and projectId are required" }, { status: 400 });
    }
    await requireOrganizationMembership(user.id, organizationId);
    const project = await ProjectService.getProject(user.id, organizationId, projectId);

    if (body.incidentId) {
      const incident = await IncidentRepo.findById(organizationId, String(body.incidentId));
      if (!incident || incident.project_id !== project.id) {
        return NextResponse.json({ error: "Incident does not belong to this project" }, { status: 400 });
      }
    }

    const githubIntegration = await ProjectIntegrationRepo.findByProjectAndProvider(project.id, "github");
    if (!githubIntegration || githubIntegration.status !== "connected") {
      return NextResponse.json({ error: "GitHub is not connected for this project" }, { status: 409 });
    }
    const installationId = parseInstallationId(githubIntegration.external_id);
    const git = new GitHubAppProvider();
    const latest = body.baseCommitSha
      ? { sha: String(body.baseCommitSha) }
      : await git.getLatestCommit(project.repository_owner, project.repository_name, project.default_branch, installationId);
    const installationToken = await git.getInstallationAccessToken(installationId);

    const workspace = await WorkspaceService.createWorkspace(user.id, new VercelSandboxProvider(), {
      organizationId,
      projectId: project.id,
      incidentId: body.incidentId ? String(body.incidentId) : undefined,
      baseCommitSha: latest.sha,
      installationToken,
      ttlMinutes: body.ttlMinutes ? Number(body.ttlMinutes) : undefined,
    });
    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create workspace" }, { status: error?.statusCode || 500 });
  }
}
