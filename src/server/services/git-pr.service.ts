import { AuditLogger } from "@/lib/audit/logger";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { assertSafeRepairBranch } from "@/lib/security/branch-guard";
import { InMemoryDatabase } from "@/lib/supabase/server";
import type { DeploymentProvider } from "../providers/deployment/deployment.interface";
import type { GitProvider } from "../providers/git/git.interface";
import { AuthGuard } from "../rbac/guard";
import { ProjectService } from "./project.service";
import { WorkspaceService } from "./workspace.service";

export class GitPrService {
  /**
   * Creates a repair branch, pushes sandbox patch changes, and opens a GitHub Pull Request.
   */
  public static async createPullRequest(
    userId: string,
    organizationId: string,
    workspaceId: string,
    gitProvider: GitProvider,
    deploymentProvider: DeploymentProvider,
    options: { title: string; description: string }
  ) {
    await AuthGuard.assertPermission(userId, organizationId, "workspace:create_pr");
    const workspace = await WorkspaceService.getWorkspace(userId, organizationId, workspaceId);
    const project = await ProjectService.getProject(userId, organizationId, workspace.project_id);

    // Assert workspace has completed validation or is ready
    if (workspace.status !== "ready_for_review") {
      throw new ValidationError(
        `Cannot create Pull Request while workspace is in status '${workspace.status}'. Automated validation checks must pass first.`
      );
    }

    // Assert repair branch is safe
    assertSafeRepairBranch(workspace.repair_branch, project.default_branch);

    // 1. Create Git branch via GitProvider
    await gitProvider.createBranch({
      owner: project.repository_owner,
      repo: project.repository_name,
      baseBranch: project.default_branch,
      newBranch: workspace.repair_branch,
    });

    // 2. Open Pull Request
    const prResult = await gitProvider.createPullRequest({
      owner: project.repository_owner,
      repo: project.repository_name,
      title: options.title || `[AI-Fix] ${project.name} Repair`,
      body: `## Automated AI Engineering Repair\n\n${options.description}\n\n- **Target Branch**: \`${workspace.repair_branch}\`\n- **Base Branch**: \`${project.default_branch}\`\n- **Base Commit**: \`${workspace.base_commit_sha}\`\n\n> ⚠️ *Production safety rule: This PR requires explicit human authorization to merge to production.*`,
      headBranch: workspace.repair_branch,
      baseBranch: project.default_branch,
    });

    const prRecordId = `pr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const prRecord = {
      id: prRecordId,
      workspace_id: workspaceId,
      provider: "github",
      repository_id: project.repository_id,
      external_pr_id: String(prResult.id),
      number: prResult.number,
      url: prResult.htmlUrl,
      branch: workspace.repair_branch,
      base_branch: project.default_branch,
      status: "open" as const,
      created_at: new Date().toISOString(),
      merged_at: null,
      merged_by: null,
    };

    InMemoryDatabase.getInstance().pullRequests.set(prRecordId, prRecord);

    // Update workspace status
    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "pr_created");

    // 3. Initiate / Track Vercel Preview
    const previewUrl =
      (await deploymentProvider.getPreviewUrl(
        project.vercel_project_id || project.slug,
        workspace.repair_branch
      )) || `https://${project.slug}-preview-pr-${prResult.number}.vercel.app`;

    const deploymentId = `dpl_prev_${Date.now()}`;
    InMemoryDatabase.getInstance().deployments.set(deploymentId, {
      id: deploymentId,
      project_id: project.id,
      workspace_id: workspaceId,
      provider: "vercel",
      external_deployment_id: deploymentId,
      environment: "preview",
      branch: workspace.repair_branch,
      commitSha: workspace.base_commit_sha,
      url: previewUrl,
      status: "ready",
      created_at: new Date().toISOString(),
      ready_at: new Date().toISOString(),
    });

    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "preview_ready");

    await AuditLogger.log({
      organizationId,
      projectId: project.id,
      workspaceId,
      userId,
      eventType: "git.pr_created",
      metadata: { prNumber: prResult.number, prUrl: prResult.htmlUrl, previewUrl },
    });

    return {
      pullRequest: prRecord,
      previewUrl,
    };
  }

  /**
   * Human Production Approval Gate:
   * Requires explicit admin or owner role to authorize merging to production branch.
   */
  public static async approveAndMerge(
    userId: string,
    organizationId: string,
    workspaceId: string,
    gitProvider: GitProvider,
    approvalNotes?: string
  ) {
    // Assert user is owner or authorized admin
    const authSession = await AuthGuard.assertProductionApproval(userId, organizationId);
    const workspace = await WorkspaceService.getWorkspace(userId, organizationId, workspaceId);
    const project = await ProjectService.getProject(userId, organizationId, workspace.project_id);

    if (workspace.status !== "preview_ready" && workspace.status !== "approved") {
      throw new ValidationError(
        `Cannot approve repair for production while workspace is in status '${workspace.status}'. Preview must be ready.`
      );
    }

    // 1. Transition to approved
    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "approved", {
      humanApproved: true,
    });

    // 2. Find associated PR
    const prs = Array.from(InMemoryDatabase.getInstance().pullRequests.values());
    const pr = prs.find((p) => p.workspace_id === workspaceId && p.status === "open");

    let mergeSha = "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0";
    if (pr) {
      const mergeResult = await gitProvider.mergePullRequest(
        project.repository_owner,
        project.repository_name,
        pr.number
      );
      mergeSha = mergeResult.sha;
      pr.status = "merged";
      pr.merged_at = new Date().toISOString();
      pr.merged_by = userId;
    }

    // 3. Transition to merged and completed
    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "merged", {
      humanApproved: true,
    });
    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "completed");

    // 4. Record production deployment entry
    const prodDeployId = `dpl_prod_${Date.now()}`;
    InMemoryDatabase.getInstance().deployments.set(prodDeployId, {
      id: prodDeployId,
      project_id: project.id,
      workspace_id: workspaceId,
      provider: "vercel",
      external_deployment_id: prodDeployId,
      environment: "production",
      branch: project.default_branch,
      commitSha: mergeSha,
      url: `https://${project.production_domain || `${project.slug}.example.com`}`,
      status: "ready",
      created_at: new Date().toISOString(),
      ready_at: new Date().toISOString(),
    });

    await AuditLogger.log({
      organizationId,
      projectId: project.id,
      workspaceId,
      userId,
      eventType: "deployment.production_approved_and_merged",
      metadata: {
        approverRole: authSession.role,
        notes: approvalNotes || "Approved for production merge",
        mergeSha,
      },
    });

    return {
      status: "merged",
      mergeSha,
      productionUrl: `https://${project.production_domain || `${project.slug}.example.com`}`,
    };
  }
}
