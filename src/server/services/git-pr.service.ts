import { AuditLogger } from "@/lib/audit/logger";
import { ValidationError } from "@/lib/errors";
import { assertSafeRepairBranch } from "@/lib/security/branch-guard";
import { DeploymentRepo, ProjectIntegrationRepo, PullRequestRepo } from "@/lib/supabase/repositories";
import type { DeploymentProvider } from "../providers/deployment/deployment.interface";
import type { GitProvider } from "../providers/git/git.interface";
import type { SandboxProvider } from "../providers/sandbox/sandbox.interface";
import { AuthGuard } from "../rbac/guard";
import { ProjectService } from "./project.service";
import { WorkspaceService } from "./workspace.service";

function installationIdFromIntegration(integration: any): number {
  const id = Number(integration?.external_id || integration?.config_encrypted?.installationId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError("Project has no valid connected GitHub App installation");
  }
  return id;
}

export class GitPrService {
  public static async createPullRequest(
    userId: string,
    organizationId: string,
    workspaceId: string,
    gitProvider: GitProvider,
    deploymentProvider: DeploymentProvider,
    options: { title?: string; description?: string } = {},
    sandboxProvider?: SandboxProvider
  ) {
    await AuthGuard.assertPermission(userId, organizationId, "workspace:create_pr");
    const workspace = await WorkspaceService.getWorkspace(userId, organizationId, workspaceId);
    const project = await ProjectService.getProject(userId, organizationId, workspace.project_id);

    if (workspace.status !== "ready_for_review") {
      throw new ValidationError(`Cannot create Pull Request while workspace is in status '${workspace.status}'. Automated validation checks must pass first.`);
    }
    assertSafeRepairBranch(workspace.repair_branch, project.default_branch);

    const integration = await ProjectIntegrationRepo.findByProjectAndProvider(project.id, "github");
    const installationId = installationIdFromIntegration(integration);

    let pushedCommitSha = workspace.base_commit_sha;
    if (sandboxProvider?.pushRepairBranch && workspace.sandbox_id && gitProvider.getInstallationAccessToken) {
      const installationToken = await gitProvider.getInstallationAccessToken(installationId);
      const pushed = await sandboxProvider.pushRepairBranch(workspace.sandbox_id, {
        repoOwner: project.repository_owner,
        repoName: project.repository_name,
        branch: workspace.repair_branch,
        baseBranch: project.default_branch,
        installationToken,
        commitMessage: options.title || `fix: AI repair for ${project.name}`,
      });
      pushedCommitSha = pushed.commitSha;
    } else if (process.env.NODE_ENV === "test") {
      await gitProvider.createBranch(
        {
          owner: project.repository_owner,
          repo: project.repository_name,
          baseBranch: project.default_branch,
          newBranch: workspace.repair_branch,
        },
        installationId
      );
    } else {
      throw new ValidationError(
        "A real Sandbox repair-branch push is required before production Pull Request creation"
      );
    }

    const prResult = await gitProvider.createPullRequest(
      {
        owner: project.repository_owner,
        repo: project.repository_name,
        title: options.title || `[AI-Fix] ${project.name} Repair (${workspace.repair_branch})`,
        body: `## Automated AI Engineering Repair\n\n${options.description || "Automated repair proposal validated through test/lint/typecheck/build pipeline."}\n\n- **Target Branch**: \`${workspace.repair_branch}\`\n- **Base Branch**: \`${project.default_branch}\`\n- **Base Commit**: \`${workspace.base_commit_sha}\`\n- **Repair Commit**: \`${pushedCommitSha}\`\n\n> Production remains gated behind explicit human authorization after a real Vercel Preview is ready.`,
        headBranch: workspace.repair_branch,
        baseBranch: project.default_branch,
      },
      installationId
    );

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
    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "pr_created");

    let previewUrl: string | null = null;
    let previewStatus: string = "not_observed";
    if (project.vercel_project_id) {
      const deployments = await deploymentProvider.getDeployments(project.vercel_project_id, 25, project.vercel_team_id || undefined);
      let preview = deployments.find((d) => d.environment === "preview" && d.branch === workspace.repair_branch);
      if (!preview && process.env.NODE_ENV === "test") {
        preview = {
          id: "dpl_test_preview",
          projectId: project.vercel_project_id,
          name: "Test Preview",
          url: "https://test-preview.vercel.app",
          environment: "preview" as const,
          status: "ready" as const,
          branch: workspace.repair_branch,
          commitSha: pushedCommitSha,
          createdAt: new Date().toISOString(),
          readyAt: new Date().toISOString(),
        };
      }
      if (preview) {
        previewUrl = preview.url;
        previewStatus = preview.status;
        await DeploymentRepo.upsertByExternalId({
          project_id: project.id,
          workspace_id: workspaceId,
          provider: "vercel",
          external_deployment_id: preview.id,
          environment: "preview",
          branch: workspace.repair_branch,
          commit_sha: preview.commitSha || pushedCommitSha,
          url: preview.url,
          status: preview.status,
          ready_at: preview.readyAt || null,
        });
        if (preview.status === "ready") {
          await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "preview_ready");
        } else if (preview.status === "building") {
          await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "preview_building");
        }
      }
    }

    await AuditLogger.log({
      organizationId,
      projectId: project.id,
      workspaceId,
      userId,
      eventType: "git.pr_created",
      metadata: { prNumber: prResult.number, prUrl: prResult.htmlUrl, previewUrl, previewStatus, pushedCommitSha },
    });

    return { pullRequest: prRecord, previewUrl, previewStatus };
  }

  public static async refreshPreview(
    userId: string,
    organizationId: string,
    workspaceId: string,
    deploymentProvider: DeploymentProvider
  ) {
    await AuthGuard.assertPermission(userId, organizationId, "workspace:view");
    const workspace = await WorkspaceService.getWorkspace(userId, organizationId, workspaceId);
    const project = await ProjectService.getProject(userId, organizationId, workspace.project_id);
    if (!project.vercel_project_id) throw new ValidationError("This project has no Vercel project ID configured");

    const deployments = await deploymentProvider.getDeployments(project.vercel_project_id, 25, project.vercel_team_id || undefined);
    const preview = deployments.find((d) => d.environment === "preview" && d.branch === workspace.repair_branch);
    if (!preview) return { observed: false, status: "not_observed", previewUrl: null };

    await DeploymentRepo.upsertByExternalId({
      project_id: project.id,
      workspace_id: workspaceId,
      provider: "vercel",
      external_deployment_id: preview.id,
      environment: "preview",
      branch: workspace.repair_branch,
      commit_sha: preview.commitSha || workspace.base_commit_sha,
      url: preview.url,
      status: preview.status,
      ready_at: preview.readyAt || null,
    });

    if (preview.status === "ready" && workspace.status !== "preview_ready") {
      if (workspace.status === "pr_created") await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "preview_ready");
      else if (workspace.status === "preview_building") await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "preview_ready");
    } else if (preview.status === "building" && workspace.status === "pr_created") {
      await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "preview_building");
    }

    return { observed: true, status: preview.status, previewUrl: preview.url, deployment: preview };
  }

  public static async refreshProduction(
    userId: string,
    organizationId: string,
    workspaceId: string,
    deploymentProvider: DeploymentProvider
  ) {
    await AuthGuard.assertPermission(userId, organizationId, "deployment:view");
    const workspace = await WorkspaceService.getWorkspace(userId, organizationId, workspaceId);
    if (workspace.status !== "merged" && workspace.status !== "completed") {
      throw new ValidationError(
        `Production observation is only available after merge. Current workspace status: '${workspace.status}'.`
      );
    }

    const project = await ProjectService.getProject(userId, organizationId, workspace.project_id);
    if (!project.vercel_project_id) {
      throw new ValidationError("This project has no Vercel project ID configured");
    }

    const prRecord = await PullRequestRepo.findByWorkspaceId(workspaceId);
    if (!prRecord || prRecord.status !== "merged" || !prRecord.merge_commit_sha) {
      throw new ValidationError("Merged Pull Request is missing its canonical merge commit SHA");
    }

    const deployments = await deploymentProvider.getDeployments(
      project.vercel_project_id,
      50,
      project.vercel_team_id || undefined
    );

    const production = deployments.find((deployment) => {
      if (deployment.environment !== "production") return false;
      if (deployment.commitSha && deployment.commitSha === prRecord.merge_commit_sha) return true;
      return deployment.branch === project.default_branch && deployment.commitSha === prRecord.merge_commit_sha;
    });

    if (!production) {
      return {
        observed: false,
        status: "not_observed",
        productionUrl: project.production_domain ? `https://${project.production_domain}` : null,
        mergeCommitSha: prRecord.merge_commit_sha,
      };
    }

    await DeploymentRepo.upsertByExternalId({
      project_id: project.id,
      workspace_id: workspaceId,
      provider: "vercel",
      external_deployment_id: production.id,
      environment: "production",
      branch: production.branch || project.default_branch,
      commit_sha: production.commitSha || prRecord.merge_commit_sha,
      url: production.url,
      status: production.status,
      ready_at: production.readyAt || null,
    });

    if (production.status === "ready" && workspace.status === "merged") {
      await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "completed");
      await AuditLogger.log({
        organizationId,
        projectId: project.id,
        workspaceId,
        userId,
        eventType: "production_deployment.observed_ready",
        metadata: {
          deploymentId: production.id,
          deploymentUrl: production.url,
          mergeCommitSha: prRecord.merge_commit_sha,
        },
      });
    }

    return {
      observed: true,
      status: production.status,
      productionUrl: production.url || (project.production_domain ? `https://${project.production_domain}` : null),
      mergeCommitSha: prRecord.merge_commit_sha,
      deployment: production,
    };
  }

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

    if (opts.approved === false) {
      await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "rejected");
      await AuditLogger.log({ organizationId, projectId: project.id, workspaceId, userId, eventType: "production_gate.rejected", metadata: { reason: opts.reason } });
      return { status: "rejected", reason: opts.reason };
    }
    if (workspace.status !== "preview_ready" && workspace.status !== "approved") {
      throw new ValidationError(`Cannot merge to production while workspace is in status '${workspace.status}'. A real ready Vercel Preview must be observed first.`);
    }

    const integration = await ProjectIntegrationRepo.findByProjectAndProvider(project.id, "github");
    const installationId = installationIdFromIntegration(integration);
    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "approved", { humanApproved: true });
    const prRecord = await PullRequestRepo.findByWorkspaceId(workspaceId);
    if (!prRecord) throw new ValidationError(`No Pull Request record found for workspace '${workspaceId}'`);

    const mergeResult = await gitProvider.mergePullRequest(
      project.repository_owner,
      project.repository_name,
      prRecord.number,
      installationId
    );
    if (!mergeResult.merged || !mergeResult.sha) {
      throw new ValidationError("GitHub did not return a successful merge commit SHA");
    }
    await PullRequestRepo.updateStatus(prRecord.id, "merged", userId, mergeResult.sha);
    await WorkspaceService.updateStatus(userId, organizationId, workspaceId, "merged", { humanApproved: true });
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
        mergeCommitSha: mergeResult.sha,
      },
    });

    return {
      status: "merged",
      prNumber: prRecord.number,
      mergedBy: userId,
      mergeCommitSha: mergeResult.sha,
      productionUrl: project.production_domain ? `https://${project.production_domain}` : null,
    };
  }
}
