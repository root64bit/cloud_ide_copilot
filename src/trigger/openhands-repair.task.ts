import { RepairArtifactRepo } from "@/lib/supabase/repositories";
import { OpenHandsAgentProvider } from "@/server/providers/agent/openhands.provider";
import type { IncidentDiagnosis } from "@/server/providers/ai/ai.interface";
import { logger, task } from "@trigger.dev/sdk";

export interface OpenHandsRepairTaskPayload {
  workspaceId: string;
  repository: string;
  branch?: string;
  incidentTitle: string;
  diagnosis: IncidentDiagnosis;
  instructions?: string;
  organizationId?: string;
  projectId?: string;
  incidentId?: string;
}

export const openHandsRepairTask = task({
  id: "openhands-repair",
  maxDuration: 60 * 60,
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: OpenHandsRepairTaskPayload) => {
    const [repoOwner, repoName] = payload.repository.split("/", 2);
    if (!repoOwner || !repoName) {
      throw new Error(`Invalid repository '${payload.repository}'. Expected owner/repository.`);
    }

    logger.info("Starting real OpenHands Cloud repair", {
      workspaceId: payload.workspaceId,
      repository: payload.repository,
      branch: payload.branch,
    });

    const agent = new OpenHandsAgentProvider();
    const result = await agent.proposePatch({
      workspaceId: payload.workspaceId,
      repoOwner,
      repoName,
      branch: payload.branch,
      incidentTitle: payload.incidentTitle,
      diagnosis: payload.diagnosis,
      instructions: payload.instructions,
    });

    // Persist repair artifact in database
    if (result.diff || result.conversationId) {
      try {
        await RepairArtifactRepo.create({
          organization_id: payload.organizationId || "00000000-0000-0000-0000-000000000001",
          project_id: payload.projectId || "10000000-0000-0000-0000-000000000001",
          workspace_id: payload.workspaceId,
          incident_id: payload.incidentId || null,
          provider: "openhands",
          conversation_id: result.conversationId || null,
          sandbox_id: result.sandboxId || null,
          patch_content: result.diff || "",
          files_changed: result.modifiedFiles || [],
          stats: {
            conversationUrl: result.conversationUrl,
            patchApplied: result.patchApplied,
          },
          status: result.patchApplied ? "completed" : "pending",
        });
      } catch (err: any) {
        logger.warn("Failed to persist repair artifact", { error: err?.message });
      }
    }

    logger.info("OpenHands Cloud repair finished", {
      workspaceId: payload.workspaceId,
      conversationId: result.conversationId,
      modifiedFiles: result.modifiedFiles,
      patchApplied: result.patchApplied,
    });

    return result;
  },
});
