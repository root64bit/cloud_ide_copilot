import { resolveWorkspaceTenant } from "@/lib/supabase/auth";
import { GitHubAppProvider } from "@/server/providers/git/github.provider";
import { GitPrService } from "@/server/services/git-pr.service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { user, tenant } = await resolveWorkspaceTenant(req, workspaceId);
    const body = await req.json().catch(() => ({}));
    const result = await GitPrService.approveAndMerge(
      user.id,
      tenant.organizationId,
      workspaceId,
      new GitHubAppProvider(),
      { approved: body.approved !== false, reason: body.reason }
    );
    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Production approval/merge failed" }, { status: error?.statusCode || 500 });
  }
}
