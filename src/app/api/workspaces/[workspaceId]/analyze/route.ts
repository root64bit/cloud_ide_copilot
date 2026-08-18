import { resolveWorkspaceTenant } from "@/lib/supabase/auth";
import { IncidentRepo } from "@/lib/supabase/repositories";
import { OpenRouterAIProvider } from "@/server/providers/ai/openrouter.provider";
import { AIAnalysisService } from "@/server/services/ai-analysis.service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { user, tenant, workspace } = await resolveWorkspaceTenant(req, workspaceId);
    const body = await req.json().catch(() => ({}));
    const incidentId = String(body.incidentId || workspace.incident_id || "");
    if (!incidentId) return NextResponse.json({ error: "This workspace has no incident to analyze" }, { status: 400 });
    const incident = await IncidentRepo.findById(tenant.organizationId, incidentId);
    if (!incident || incident.project_id !== workspace.project_id) {
      return NextResponse.json({ error: "Incident does not belong to this workspace project" }, { status: 400 });
    }
    const diagnosis = await AIAnalysisService.runIncidentDiagnosis(
      user.id,
      tenant.organizationId,
      incidentId,
      new OpenRouterAIProvider(),
      workspaceId
    );
    return NextResponse.json({ diagnosis });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to analyze incident" }, { status: error?.statusCode || 500 });
  }
}
