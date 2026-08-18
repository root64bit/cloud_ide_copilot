import { resolveWorkspaceTenant } from "@/lib/supabase/auth";
import { IncidentRepo } from "@/lib/supabase/repositories";
import { OpenRouterAIProvider } from "@/server/providers/ai/openrouter.provider";
import { AIAnalysisService } from "@/server/services/ai-analysis.service";
import { ProjectService } from "@/server/services/project.service";
import { WorkspaceService } from "@/server/services/workspace.service";
import type { openHandsRepairTask } from "@/trigger/openhands-repair.task";
import { tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    if (!process.env.TRIGGER_SECRET_KEY) {
      return NextResponse.json({ error: "TRIGGER_NOT_CONFIGURED" }, { status: 503 });
    }
    const { workspaceId } = await params;
    const { user, tenant, workspace } = await resolveWorkspaceTenant(req, workspaceId);
    const body = await req.json().catch(() => ({}));
    const incidentId = String(body.incidentId || workspace.incident_id || "");
    if (!incidentId) return NextResponse.json({ error: "This workspace has no incident to repair" }, { status: 400 });
    const incident = await IncidentRepo.findById(tenant.organizationId, incidentId);
    if (!incident || incident.project_id !== workspace.project_id) {
      return NextResponse.json({ error: "Incident does not belong to this workspace project" }, { status: 400 });
    }
    const project = await ProjectService.getProject(user.id, tenant.organizationId, workspace.project_id);
    const diagnosis = await AIAnalysisService.runIncidentDiagnosis(
      user.id,
      tenant.organizationId,
      incidentId,
      new OpenRouterAIProvider(),
      workspaceId
    );
    await WorkspaceService.updateStatus(user.id, tenant.organizationId, workspaceId, "analyzing");
    await WorkspaceService.updateStatus(user.id, tenant.organizationId, workspaceId, "repairing");

    const handle = await tasks.trigger<typeof openHandsRepairTask>(
      "openhands-repair",
      {
        workspaceId,
        organizationId: tenant.organizationId,
        projectId: project.id,
        incidentId,
        repository: `${project.repository_owner}/${project.repository_name}`,
        branch: project.default_branch,
        incidentTitle: incident.title,
        diagnosis,
        instructions: typeof body.instructions === "string" ? body.instructions : undefined,
      },
      { tags: [`workspace:${workspaceId}`, `project:${project.id}`, `organization:${tenant.organizationId}`, "provider:openhands"] }
    );

    return NextResponse.json({ queued: true, provider: "trigger.dev", task: "openhands-repair", runId: handle.id }, { status: 202 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to queue OpenHands repair" }, { status: error?.statusCode || 500 });
  }
}
