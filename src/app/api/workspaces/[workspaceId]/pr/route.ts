import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { VercelDeploymentProvider } from "@/server/providers/deployment/vercel.provider";
import { GitHubAppProvider } from "@/server/providers/git/github.provider";
import { GitPrService } from "@/server/services/git-pr.service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const user = await getAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));
    const organizationId = body.organizationId || "00000000-0000-0000-0000-000000000001";

    const gitProvider = new GitHubAppProvider();
    const deploymentProvider = new VercelDeploymentProvider();

    const result = await GitPrService.createPullRequest(
      user.id,
      organizationId,
      workspaceId,
      gitProvider,
      deploymentProvider,
      {
        title: body.title,
        description: body.description,
      }
    );

    return NextResponse.json({
      ok: true,
      pullRequest: result.pullRequest,
      previewUrl: result.previewUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to create Pull Request" },
      { status: error?.statusCode || 500 }
    );
  }
}
