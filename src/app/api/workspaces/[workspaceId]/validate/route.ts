import { resolveWorkspaceTenant } from "@/lib/supabase/auth";
import { VercelSandboxProvider } from "@/server/providers/sandbox/vercel-sandbox.provider";
import { ValidationService } from "@/server/services/validation.service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { user, tenant } = await resolveWorkspaceTenant(req, workspaceId);
    const result = await ValidationService.runValidationPipeline(
      user.id,
      tenant.organizationId,
      workspaceId,
      new VercelSandboxProvider()
    );
    return NextResponse.json({ ok: true, workspaceId, allPassed: result.allPassed, steps: result.stepResults, validationResult: result });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Validation pipeline failed" }, { status: error?.statusCode || 500 });
  }
}
