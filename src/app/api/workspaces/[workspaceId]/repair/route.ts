import { OpenRouterAIProvider } from "@/server/providers/ai/openrouter.provider";
import { AIAnalysisService } from "@/server/services/ai-analysis.service";
import { ProjectService } from "@/server/services/project.service";
import { WorkspaceService } from "@/server/services/workspace.service";
import type { openHandsRepairTask } from "@/trigger/openhands-repair.task";
import { tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    if (!process.env.TRIGGER_SECRET_KEY) {
      return NextResponse.json(
        { error: "TRIGGER_NOT_CONFIGURED", message: "Set TRIGGER_SECRET_KEY before running asynchronous repairs." },
        { status: 503 }
      );
    }
    const { workspaceId } = await params;
    const body = await req.json();
    const userId = body.userId || "user_engineer";
    const organizationId = body.organizationId || "00000000-0000-0000-0000-000000000001";
    const incidentId = body.incidentId || "20000000-0000-0000-0000-000000000001";

    const workspace = await WorkspaceService.getWorkspace(userId, organizationId, workspaceId);
    const project = await ProjectService.getProject(userId, organizationId, workspace.project_id);
    const aiProvider = new OpenRouterAIProvider();
    const diagnosis = await AIAnalysisService.runIncidentDiagnosis(
      userId,
      organizationId,
      incidentId,
      aiProvider,
      workspaceId
    );

    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "analyzing");
    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "repairing");

    const handle = await tasks.trigger<typeof openHandsRepairTask>(
      "openhands-repair",
      {
        workspaceId,
        repository: `${project.repository_owner}/${project.repository_name}`,
        branch: project.default_branch,
        incidentTitle: body.incidentTitle || "Production incident repair",
        diagnosis,
        instructions: typeof body.instructions === "string" ? body.instructions : undefined,
      },
      {
        tags: [
          `workspace:${workspaceId}`,
          `project:${project.id}`,
          `organization:${organizationId}`,
          "provider:openhands",
        ],
      }
    );

    return NextResponse.json(
      {
        queued: true,
        provider: "trigger.dev",
        task: "openhands-repair",
        runId: handle.id,
        publicAccessToken: handle.publicAccessToken,
      },
      { status: 202 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to queue OpenHands repair" },
      { status: error?.statusCode || 500 }
    );
  }
}
