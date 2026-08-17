import { task } from "@trigger.dev/sdk";

/**
 * Reserved orchestration entrypoint for the deterministic sandbox validation pipeline.
 *
 * IMPORTANT: this task intentionally fails until the Vercel Sandbox provider is switched
 * from the scaffold implementation to a real @vercel/sandbox-backed workspace. Returning
 * allPassed=true here would create a dangerous false release gate.
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
      `VALIDATION_PIPELINE_NOT_WIRED: workspace ${payload.workspaceId} cannot be validated until the real sandbox provider is enabled.`
    );
  },
});
