import { RepairArtifactRepo, WorkspaceRepo } from "@/lib/supabase/repositories";
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
  organizationId: string;
  projectId: string;
  incidentId: string;
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

    const workspace = await WorkspaceRepo.findByIdAny(payload.workspaceId);
    if (!workspace || workspace.organization_id !== payload.organizationId || workspace.project_id !== payload.projectId || workspace.incident_id !== payload.incidentId) {
      throw new Error("Trigger repair payload does not match the persisted workspace tenant/project/incident");
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
      baseCommitSha: workspace.base_commit_sha,
      incidentTitle: payload.incidentTitle,
      diagnosis: payload.diagnosis,
      instructions: payload.instructions,
    });

    // Persist the provider result before the Vercel-hosted control plane applies it to its own Sandbox.
    if (result.diff || result.conversationId) {
      await RepairArtifactRepo.create({
        organization_id: payload.organizationId,
        project_id: payload.projectId,
        workspace_id: payload.workspaceId,
        incident_id: payload.incidentId,
        provider: "openhands",
        conversation_id: result.conversationId || null,
        sandbox_id: result.sandboxId || null,
        patch_content: result.diff || "",
        files_changed: result.modifiedFiles || [],
        stats: {
          conversationUrl: result.conversationUrl,
          patchGenerated: result.patchApplied,
          sandboxApplied: false,
        },
        status: "pending",
      });
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
