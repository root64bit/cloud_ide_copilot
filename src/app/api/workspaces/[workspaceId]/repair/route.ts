import { OpenHandsAgentProvider } from "@/server/providers/agent/openhands.provider";
import { OpenRouterAIProvider } from "@/server/providers/ai/openrouter.provider";
import { VercelSandboxProvider } from "@/server/providers/sandbox/vercel-sandbox.provider";
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
    const sandboxProvider = new VercelSandboxProvider();
    const codingAgent = new OpenHandsAgentProvider(aiProvider, sandboxProvider);

    const repairPlan = await AIAnalysisService.generateRepairPatch(
      userId,
      organizationId,
      workspaceId,
      incidentId,
      codingAgent,
      aiProvider
    );

    return NextResponse.json({ repairPlan });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to generate repair patch" },
      { status: error?.statusCode || 500 }
    );
  }
}
