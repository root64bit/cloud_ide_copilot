import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { VercelSandboxProvider } from "@/server/providers/sandbox/vercel-sandbox.provider";
import { ValidationService } from "@/server/services/validation.service";
import { WorkspaceService } from "@/server/services/workspace.service";
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

    const workspace = await WorkspaceService.getWorkspace(user.id, organizationId, workspaceId);
    const sandboxProvider = new VercelSandboxProvider();

    const result = await ValidationService.runValidationPipeline(
      user.id,
      organizationId,
      workspace.id,
      sandboxProvider
    );

    return NextResponse.json({
      ok: true,
      workspaceId: workspace.id,
      allPassed: result.allPassed,
      steps: result.stepResults,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Validation pipeline failed" },
      { status: error?.statusCode || 500 }
    );
  }
}
