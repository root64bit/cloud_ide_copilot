import { AuditLogger } from "@/lib/audit/logger";
import { AIAnalysisRepo } from "@/lib/supabase/repositories";
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
    if (workspaceId) {
      const workspace = await WorkspaceService.getWorkspace(userId, organizationId, workspaceId);
      if (workspace.project_id !== incident.project_id) {
        throw new Error("Incident does not belong to the workspace project");
      }
    }

    const diagnosis = await aiProvider.diagnoseIncident({
      title: incident.title,
      level: incident.level,
      environment: incident.environment,
      stacktrace: incident.sanitized_metadata?.stacktrace || [],
    });

    await AIAnalysisRepo.create({
      workspace_id: workspaceId || null,
      incident_id: incidentId,
      provider: "openrouter",
      model: process.env.OPENROUTER_ANALYSIS_MODEL || process.env.OPENROUTER_MODEL || "openrouter/auto",
      analysis_type: "incident_diagnosis",
      structured_result: diagnosis as any,
      created_by: userId,
    });

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
    if (incident.project_id !== workspace.project_id) {
      throw new Error("Incident does not belong to the workspace project");
    }
    const project = await ProjectService.getProject(userId, organizationId, workspace.project_id);

    // 1. Get or generate diagnosis
    const diagnosis = await this.runIncidentDiagnosis(userId, organizationId, incidentId, aiProvider, workspaceId);

    // 2. State transition to analyzing / repairing
    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "analyzing");
    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "repairing");

    // 3. Propose and apply patch via coding agent
    const result = await codingAgent.proposePatch({
      workspaceId: workspace.id,
      repoOwner: project.repository_owner,
      repoName: project.repository_name,
      branch: project.default_branch,
      baseCommitSha: workspace.base_commit_sha,
      incidentTitle: incident.title,
      diagnosis,
    });

    await AIAnalysisRepo.create({
      workspace_id: workspaceId,
      incident_id: incidentId,
      provider: "openhands",
      model: process.env.OPENHANDS_MODEL || "openhands-account-default",
      analysis_type: "repair_plan",
      structured_result: result.repairPlan as any,
      created_by: userId,
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
