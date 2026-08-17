import { AuditLogger } from "@/lib/audit/logger";
import { InMemoryDatabase } from "@/lib/supabase/server";
import type { CodingAgent } from "../providers/agent/agent.interface";
import type { AIProvider, IncidentDiagnosis, RepairPlan } from "../providers/ai/ai.interface";
import { AuthGuard } from "../rbac/guard";
import { IncidentService } from "./incident.service";
import { ProjectService } from "./project.service";
import { WorkspaceService } from "./workspace.service";

export class AIAnalysisService {
  public static async runIncidentDiagnosis(
    userId: string,
    organizationId: string,
    incidentId: string,
    aiProvider: AIProvider,
    workspaceId?: string
  ): Promise<IncidentDiagnosis> {
    await AuthGuard.assertPermission(userId, organizationId, "incident:diagnose");
    const incident = await IncidentService.getIncident(userId, organizationId, incidentId);

    const diagnosis = await aiProvider.diagnoseIncident({
      title: incident.title,
      level: incident.level,
      environment: incident.environment,
      stacktrace: incident.sanitized_metadata?.stacktrace || [],
    });

    const analysisId = `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record = {
      id: analysisId,
      workspace_id: workspaceId || null,
      incident_id: incidentId,
      provider: "openrouter",
      model: process.env.OPENROUTER_ANALYSIS_MODEL || "configured-openrouter-model",
      analysis_type: "incident_diagnosis",
      structured_result: diagnosis,
      created_by: userId,
      created_at: new Date().toISOString(),
    };

    InMemoryDatabase.getInstance().aiAnalyses.set(analysisId, record);

    await AuditLogger.log({
      organizationId,
      projectId: incident.project_id,
      workspaceId,
      userId,
      eventType: "ai.diagnosis_generated",
      metadata: { incidentId, confidence: diagnosis.confidence },
    });

    return diagnosis;
  }

  public static async generateRepairPatch(
    userId: string,
    organizationId: string,
    workspaceId: string,
    incidentId: string,
    codingAgent: CodingAgent,
    aiProvider: AIProvider
  ): Promise<RepairPlan> {
    await AuthGuard.assertPermission(userId, organizationId, "workspace:run_ai_repair");
    const workspace = await WorkspaceService.getWorkspace(userId, organizationId, workspaceId);
    const incident = await IncidentService.getIncident(userId, organizationId, incidentId);
    const project = await ProjectService.getProject(userId, organizationId, workspace.project_id);

    // 1. Get or generate diagnosis
    const diagnosis = await this.runIncidentDiagnosis(userId, organizationId, incidentId, aiProvider, workspaceId);

    // 2. State transition to analyzing / repairing
    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "analyzing");
    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "repairing");

    // 3. Propose and apply patch via coding agent
    const result = await codingAgent.proposePatch({
      workspaceId: workspace.sandbox_id || workspace.id,
      repoOwner: project.repository_owner,
      repoName: project.repository_name,
      branch: project.default_branch,
      incidentTitle: incident.title,
      diagnosis,
    });

    const analysisId = `patch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    InMemoryDatabase.getInstance().aiAnalyses.set(analysisId, {
      id: analysisId,
      workspace_id: workspaceId,
      incident_id: incidentId,
      provider: "openhands",
      model: process.env.OPENHANDS_MODEL || "openhands-account-default",
      analysis_type: "repair_plan",
      structured_result: result.repairPlan,
      created_by: userId,
      created_at: new Date().toISOString(),
    });

    await AuditLogger.log({
      organizationId,
      projectId: workspace.project_id,
      workspaceId,
      userId,
      eventType: "ai.patch_applied",
      metadata: { modifiedFiles: result.modifiedFiles, summary: result.summary },
    });

    return result.repairPlan;
  }
}
