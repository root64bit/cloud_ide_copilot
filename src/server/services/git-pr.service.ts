import { AuditLogger } from "@/lib/audit/logger";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { assertSafeRepairBranch } from "@/lib/security/branch-guard";
import { DeploymentRepo, PullRequestRepo } from "@/lib/supabase/repositories";
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
    options: { title?: string; description?: string } = {}
  ) {
    await AuthGuard.assertPermission(userId, organizationId, "workspace:create_pr");
    const workspace = await WorkspaceService.getWorkspace(userId, organizationId, workspaceId);
    const project = await ProjectService.getProject(userId, organizationId, workspace.project_id);

    // Assert workspace has completed validation
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
      title: options.title || `[AI-Fix] ${project.name} Repair (${workspace.repair_branch})`,
      body: `## Automated AI Engineering Repair\n\n${options.description || "Automated repair proposal validated through test/lint/typecheck/build pipeline."}\n\n- **Target Branch**: \`${workspace.repair_branch}\`\n- **Base Branch**: \`${project.default_branch}\`\n- **Base Commit**: \`${workspace.base_commit_sha}\`\n\n> ⚠️ *Production safety rule: This PR requires explicit human authorization from an authorized engineer or admin before merging to production.*`,
      headBranch: workspace.repair_branch,
      baseBranch: project.default_branch,
    });

    const prRecord = await PullRequestRepo.create({
      workspace_id: workspaceId,
      provider: "github",
      repository_id: project.repository_id,
      external_pr_id: String(prResult.id),
      number: prResult.number,
      url: prResult.htmlUrl,
      branch: workspace.repair_branch,
      base_branch: project.default_branch,
      status: "open",
    });

    // Update workspace status
    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "pr_created");

    // 3. Initiate / Track Vercel Preview
    const previewUrl =
      (await deploymentProvider.getPreviewUrl(
        project.vercel_project_id || project.slug,
        workspace.repair_branch
      )) || `https://${project.slug}-preview-pr-${prResult.number}.vercel.app`;

    await DeploymentRepo.create({
      project_id: project.id,
      workspace_id: workspaceId,
      provider: "vercel",
      external_deployment_id: `dpl_prev_${Date.now()}`,
      environment: "preview",
      branch: workspace.repair_branch,
      commit_sha: workspace.base_commit_sha,
      url: previewUrl,
      status: "ready",
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
    options: { approved?: boolean; reason?: string } | string = {}
  ) {
    await AuthGuard.assertPermission(userId, organizationId, "deployment:approve_production");
    const workspace = await WorkspaceService.getWorkspace(userId, organizationId, workspaceId);
    const project = await ProjectService.getProject(userId, organizationId, workspace.project_id);

    const opts = typeof options === "string" ? { approved: true, reason: options } : options;
    const isApproved = opts.approved !== false;
    const reason = opts.reason;

    if (!isApproved) {
      // Rejection branch
      await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "rejected");
      await AuditLogger.log({
        organizationId,
        projectId: project.id,
        workspaceId,
        userId,
        eventType: "production_gate.rejected",
        metadata: { reason },
      });
      return { status: "rejected", reason };
    }

    // Must be in preview_ready or approved state
    if (workspace.status !== "preview_ready" && workspace.status !== "approved") {
      throw new ValidationError(
        `Cannot merge to production while workspace is in status '${workspace.status}'. Preview must be verified first.`
      );
    }

    // 1. Advance to approved state
    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "approved", {
      humanApproved: true,
    });

    // 2. Fetch associated PR
    const prRecord = await PullRequestRepo.findByWorkspaceId(workspaceId);
    if (!prRecord) {
      throw new ValidationError(`No Pull Request record found for workspace '${workspaceId}'`);
    }

    // 3. Execute merge via GitProvider
    await gitProvider.mergePullRequest(
      project.repository_owner,
      project.repository_name,
      prRecord.number
    );

    // 4. Update PR record status
    await PullRequestRepo.updateStatus(prRecord.id, "merged", userId);

    // 5. Advance workspace to merged state (remains merged until production deployment is verified)
    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "merged");

    await AuditLogger.log({
      organizationId,
      projectId: project.id,
      workspaceId,
      userId,
      eventType: "production_gate.merged",
      metadata: {
        prNumber: prRecord.number,
        authorizer: userId,
        repairBranch: workspace.repair_branch,
      },
    });

    return {
      status: "merged",
      prNumber: prRecord.number,
      mergedBy: userId,
      productionUrl: project.production_domain
        ? `https://${project.production_domain}`
        : `https://${project.slug}.vercel.app`,
    };
  }
}
