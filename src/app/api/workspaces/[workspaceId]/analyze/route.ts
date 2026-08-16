import { OpenRouterAIProvider } from "@/server/providers/ai/openrouter.provider";
import { AIAnalysisService } from "@/server/services/ai-analysis.service";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const body = await req.json();
    const userId = "user_engineer";
    const organizationId = body.organizationId || "00000000-0000-0000-0000-000000000001";
    const incidentId = body.incidentId || "20000000-0000-0000-0000-000000000001";

    const aiProvider = new OpenRouterAIProvider();
    const diagnosis = await AIAnalysisService.runIncidentDiagnosis(
      userId,
      organizationId,
      incidentId,
      aiProvider,
      workspaceId
    );

    return NextResponse.json({ diagnosis });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to analyze incident" },
      { status: error?.statusCode || 500 }
    );
  }
}
