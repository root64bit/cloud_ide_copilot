import { resolveWorkspaceTenant } from "@/lib/supabase/auth";
import { VercelDeploymentProvider } from "@/server/providers/deployment/vercel.provider";
import { GitHubAppProvider } from "@/server/providers/git/github.provider";
import { VercelSandboxProvider } from "@/server/providers/sandbox/vercel-sandbox.provider";
import { GitPrService } from "@/server/services/git-pr.service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { user, tenant } = await resolveWorkspaceTenant(req, workspaceId);
    const body = await req.json().catch(() => ({}));
    const result = await GitPrService.createPullRequest(
      user.id,
      tenant.organizationId,
      workspaceId,
      new GitHubAppProvider(),
      new VercelDeploymentProvider(),
      { title: body.title, description: body.description },
      new VercelSandboxProvider()
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to create Pull Request" }, { status: error?.statusCode || 500 });
  }
}
