import { getAuthenticatedUser } from "@/lib/supabase/auth";
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
    const approved = body.approved !== false;
    const reason = body.reason;

    const gitProvider = new GitHubAppProvider();

    const result = await GitPrService.approveAndMerge(
      user.id,
      organizationId,
      workspaceId,
      gitProvider,
      { approved, reason }
    );

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Production approval/merge failed" },
      { status: error?.statusCode || 500 }
    );
  }
}
