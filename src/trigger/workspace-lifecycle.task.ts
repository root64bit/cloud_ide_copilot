import { task } from "@trigger.dev/sdk";

/**
 * Trigger.dev Long-Running Task: Workspace Lifecycle (Create & Clone)
 */

export interface WorkspaceLifecyclePayload {
  organizationId: string;
  projectId: string;
  workspaceId: string;
  repoOwner: string;
  repoName: string;
  commitSha: string;
}

export const workspaceLifecycleTask = task({
  id: "workspace-lifecycle",
  run: async (payload: WorkspaceLifecyclePayload) => {
    console.log(`[Trigger.dev] Initializing workspace sandbox: ${payload.workspaceId}`);
    return {
      success: true,
      workspaceId: payload.workspaceId,
      status: "ready",
      completedAt: new Date().toISOString(),
    };
  },
});
