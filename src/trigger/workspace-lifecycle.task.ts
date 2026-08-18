import { task } from "@trigger.dev/sdk";

/**
 * Reserved future orchestration entrypoint.
 *
 * Current Vercel Sandbox creation happens in the Vercel-hosted control plane so
 * it can use Vercel deployment identity/OIDC. This task intentionally fails
 * instead of pretending an external Trigger.dev worker created a sandbox.
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
      `WORKSPACE_LIFECYCLE_CONTROL_PLANE_ONLY: workspace ${payload.workspaceId} is created by the Vercel-hosted control plane. Enable explicit external Vercel Sandbox credentials before moving this job to Trigger.dev.`
    );
  },
});
