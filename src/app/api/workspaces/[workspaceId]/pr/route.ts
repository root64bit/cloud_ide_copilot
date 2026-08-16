import { VercelDeploymentProvider } from "@/server/providers/deployment/vercel.provider";
import { MockGitProvider } from "@/server/providers/git/mock.provider";
import { GitPrService } from "@/server/services/git-pr.service";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const body = await req.json();
    const userId = "user_engineer";
    const organizationId = body.organizationId || "00000000-0000-0000-0000-000000000001";
    const title = body.title || "Automated Repair PR";
    const description = body.description || "Fixes production incident with validated unit test coverage.";

    const gitProvider = new MockGitProvider();
    const deploymentProvider = new VercelDeploymentProvider();

    const result = await GitPrService.createPullRequest(
      userId,
      organizationId,
      workspaceId,
      gitProvider,
      deploymentProvider,
      { title, description }
    );

    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create Pull Request" },
      { status: error?.statusCode || 500 }
    );
  }
}
