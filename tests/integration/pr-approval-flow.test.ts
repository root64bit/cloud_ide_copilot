import { ForbiddenError } from "@/lib/errors";
import { VercelDeploymentProvider } from "@/server/providers/deployment/vercel.provider";
import { MockGitProvider } from "@/server/providers/git/mock.provider";
import { MockSandboxProvider } from "@/server/providers/sandbox/mock-sandbox.provider";
import { GitPrService } from "@/server/services/git-pr.service";
import { ValidationService } from "@/server/services/validation.service";
import { WorkspaceService } from "@/server/services/workspace.service";
import { describe, expect, it } from "vitest";

describe("End-to-End PR & Human Approval Flow Integration Tests", () => {
  const orgId = "00000000-0000-0000-0000-000000000001";
  const projId = "10000000-0000-0000-0000-000000000001";
  const engineerId = "user_engineer";
  const ownerId = "user_owner";

  it("orchestrates validation -> PR creation -> human approval gate -> production merge", async () => {
    const sandboxProvider = new MockSandboxProvider();
    const gitProvider = new MockGitProvider();
    const deploymentProvider = new VercelDeploymentProvider();

    // 1. Create Workspace
    const workspace = await WorkspaceService.createWorkspace(engineerId, sandboxProvider, {
      organizationId: orgId,
      projectId: projId,
    });

    // 2. Run Automated Validation
    const valResult = await ValidationService.runValidationPipeline(
      engineerId,
      orgId,
      workspace.id,
      sandboxProvider
    );
    expect(valResult.allPassed).toBe(true);

    // 3. Create Pull Request
    const prResult = await GitPrService.createPullRequest(
      engineerId,
      orgId,
      workspace.id,
      gitProvider,
      deploymentProvider,
      {
        title: "fix(pricing): calculateTotal null check",
        description: "Validated defensive discountCode fix",
      }
    );

    expect(prResult.pullRequest.number).toBeGreaterThan(0);
    expect(prResult.previewUrl).toContain("vercel.app");

    // 4. Security Check: Engineer role CANNOT approve production merge
    await expect(
      GitPrService.approveAndMerge(engineerId, orgId, workspace.id, gitProvider)
    ).rejects.toThrowError(ForbiddenError);

    // 5. Authorized Owner approves and merges to production
    const mergeResult = await GitPrService.approveAndMerge(
      ownerId,
      orgId,
      workspace.id,
      gitProvider,
      "Human verified on preview"
    );

    expect(mergeResult.status).toBe("merged");
    expect(mergeResult.productionUrl).toContain("onedealer.example.com");

    const finalWorkspace = await WorkspaceService.getWorkspace(ownerId, orgId, workspace.id);
    expect(finalWorkspace.status).toBe("completed");
  });
});
