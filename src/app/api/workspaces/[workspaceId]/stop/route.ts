import { resolveWorkspaceTenant } from "@/lib/supabase/auth";
import { VercelSandboxProvider } from "@/server/providers/sandbox/vercel-sandbox.provider";
import { WorkspaceService } from "@/server/services/workspace.service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { user, tenant } = await resolveWorkspaceTenant(req, workspaceId);
    const workspace = await WorkspaceService.stopWorkspace(user.id, tenant.organizationId, workspaceId, new VercelSandboxProvider());
    return NextResponse.json({ ok: true, workspace });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to stop workspace" }, { status: error?.statusCode || 500 });
  }
}
