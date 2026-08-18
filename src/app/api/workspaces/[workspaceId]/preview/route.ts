import { resolveWorkspaceTenant } from "@/lib/supabase/auth";
import { VercelDeploymentProvider } from "@/server/providers/deployment/vercel.provider";
import { GitPrService } from "@/server/services/git-pr.service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { user, tenant } = await resolveWorkspaceTenant(req, workspaceId);
    const result = await GitPrService.refreshPreview(user.id, tenant.organizationId, workspaceId, new VercelDeploymentProvider());
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to refresh preview" }, { status: error?.statusCode || 500 });
  }
}
