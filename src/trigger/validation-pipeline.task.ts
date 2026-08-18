import { task } from "@trigger.dev/sdk";

/**
 * Reserved future durable validation entrypoint.
 *
 * The current real validation pipeline executes against Vercel Sandbox from the
 * Vercel-hosted control plane. Moving this long-running workflow to Trigger.dev
 * requires explicit Vercel Sandbox external credentials in the Trigger worker.
 */
export interface ValidationPipelinePayload {
  organizationId: string;
  projectId: string;
  workspaceId: string;
  userId: string;
}

export const validationPipelineTask = task({
  id: "validation-pipeline",
  run: async (payload: ValidationPipelinePayload) => {
    throw new Error(
      `VALIDATION_PIPELINE_CONTROL_PLANE_ONLY: workspace ${payload.workspaceId} validation currently runs through the authenticated Vercel control plane.`
    );
  },
});
