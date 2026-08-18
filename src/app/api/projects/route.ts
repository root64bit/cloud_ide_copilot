import { getAuthenticatedUser, requireOrganizationMembership } from "@/lib/supabase/auth";
import { GitHubAppProvider } from "@/server/providers/git/github.provider";
import { ProjectService } from "@/server/services/project.service";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const orgId = new URL(req.url).searchParams.get("orgId");
    if (!orgId) return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    await requireOrganizationMembership(user.id, orgId);
    const projects = await ProjectService.listProjects(user.id, orgId);
    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to list projects" }, { status: error?.statusCode || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const organizationId = String(body.organizationId || "");
    const installationId = Number(req.cookies.get("github_installation_id")?.value);
    if (!organizationId || !Number.isInteger(installationId) || installationId <= 0) {
      return NextResponse.json(
        { error: "organizationId and a verified GitHub installation session are required" },
        { status: 400 }
      );
    }
    await requireOrganizationMembership(user.id, organizationId);

    const git = new GitHubAppProvider();
    const repository = await git.getRepository(String(body.repositoryOwner || ""), String(body.repositoryName || ""), installationId);

    const project = await ProjectService.createProject(user.id, {
      ...body,
      organizationId,
      repositoryOwner: repository.owner,
      repositoryName: repository.name,
      repositoryId: repository.id,
      defaultBranch: repository.defaultBranch,
      githubInstallationId: installationId,
    });
    const response = NextResponse.json({ project }, { status: 201 });
    response.cookies.delete("github_installation_id");
    response.cookies.delete("github_installation_repo_count");
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create project" }, { status: error?.statusCode || 500 });
  }
}
