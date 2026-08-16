import { MockSandboxProvider } from "@/server/providers/sandbox/mock-sandbox.provider";
import { ValidationService } from "@/server/services/validation.service";
import { WorkspaceService } from "@/server/services/workspace.service";
import { describe, expect, it } from "vitest";

describe("Validation Gate Integration Tests", () => {
  const orgId = "00000000-0000-0000-0000-000000000001";
  const projId = "10000000-0000-0000-0000-000000000001";
  const userId = "user_engineer";

  it("runs the full test/lint/typecheck/build pipeline and advances state on success", async () => {
    const sandboxProvider = new MockSandboxProvider();
    const workspace = await WorkspaceService.createWorkspace(userId, sandboxProvider, {
      organizationId: orgId,
      projectId: projId,
    });

    const result = await ValidationService.runValidationPipeline(
      userId,
      orgId,
      workspace.id,
      sandboxProvider
    );

    expect(result.allPassed).toBe(true);
    expect(result.stepResults.length).toBe(5);

    const updatedWorkspace = await WorkspaceService.getWorkspace(userId, orgId, workspace.id);
    expect(updatedWorkspace.status).toBe("ready_for_review");
  });
});
