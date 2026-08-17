import { logger, task } from "@trigger.dev/sdk";
import { OpenHandsAgentProvider } from "@/server/providers/agent/openhands.provider";
import type { IncidentDiagnosis } from "@/server/providers/ai/ai.interface";

export interface OpenHandsRepairTaskPayload {
  workspaceId: string;
  repository: string;
  branch?: string;
  incidentTitle: string;
  diagnosis: IncidentDiagnosis;
  instructions?: string;
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

    logger.info("OpenHands Cloud repair finished", {
      workspaceId: payload.workspaceId,
      conversationId: result.conversationId,
      modifiedFiles: result.modifiedFiles,
      patchApplied: result.patchApplied,
    });

    return result;
  },
});
