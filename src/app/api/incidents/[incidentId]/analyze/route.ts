import { getAuthenticatedUser, requireOrganizationMembership } from "@/lib/supabase/auth";
import { IncidentRepo } from "@/lib/supabase/repositories";
import { OpenRouterAIProvider } from "@/server/providers/ai/openrouter.provider";
import { AIAnalysisService } from "@/server/services/ai-analysis.service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ incidentId: string }> }) {
  try {
    const { incidentId } = await params;
    const user = await getAuthenticatedUser(req);
    const incident = await IncidentRepo.findByIdAny(incidentId);

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    await requireOrganizationMembership(user.id, incident.organization_id);
    const diagnosis = await AIAnalysisService.runIncidentDiagnosis(
      user.id,
      incident.organization_id,
      incidentId,
      new OpenRouterAIProvider()
    );

    return NextResponse.json({ diagnosis });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to analyze incident" },
      { status: error?.statusCode || 500 }
    );
  }
}
