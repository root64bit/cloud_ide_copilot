import { task } from "@trigger.dev/sdk";

/**
 * Reserved orchestration entrypoint for Vercel Sandbox workspace creation/cloning.
 * It deliberately fails instead of reporting a simulated ready workspace.
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
    throw new Error(
      `WORKSPACE_LIFECYCLE_NOT_WIRED: workspace ${payload.workspaceId} requires the real @vercel/sandbox provider before this task can run.`
    );
  },
});
