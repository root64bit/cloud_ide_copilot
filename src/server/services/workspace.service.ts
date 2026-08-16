import { AuditLogger } from "@/lib/audit/logger";
import { NotFoundError } from "@/lib/errors";
import { validateAndResolveCommand } from "@/lib/security/allowlist";
import { generateRepairBranchName } from "@/lib/security/branch-guard";
import { InMemoryDatabase } from "@/lib/supabase/server";
import type { CommandType, WorkspaceStatus } from "@/lib/supabase/types";
import type { SandboxProvider } from "../providers/sandbox/sandbox.interface";
import { AuthGuard } from "../rbac/guard";
import { WorkspaceStateMachine } from "../state-machine/workspace-state";
import { ProjectService } from "./project.service";

export interface CreateWorkspaceInput {
  organizationId: string;
  projectId: string;
  incidentId?: string;
  baseCommitSha?: string;
  ttlMinutes?: number;
}

export class WorkspaceService {
  public static async createWorkspace(
    userId: string,
    sandboxProvider: SandboxProvider,
    input: CreateWorkspaceInput
  ) {
    await AuthGuard.assertPermission(userId, input.organizationId, "workspace:create");
    const project = await ProjectService.getProject(userId, input.organizationId, input.projectId);

    const workspaceId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const baseCommitSha = input.baseCommitSha || "a9f82d1c5e4b7890123456789abcdef012345678";
    const repairBranch = generateRepairBranchName(project.slug, input.incidentId ? "fix" : "dev");
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + (input.ttlMinutes || 60) * 60000).toISOString();

    // 1. Create sandbox instance
    const sandboxInstance = await sandboxProvider.createSandbox({
      name: `ws-${project.slug}-${workspaceId.slice(-4)}`,
      repoOwner: project.repository_owner,
      repoName: project.repository_name,
      commitSha: baseCommitSha,
      ttlMinutes: input.ttlMinutes,
    });

    const workspace = {
      id: workspaceId,
      organization_id: input.organizationId,
      project_id: project.id,
      incident_id: input.incidentId || null,
      sandbox_provider: "vercel_sandbox",
      sandbox_id: sandboxInstance.id,
      sandbox_name: sandboxInstance.name,
      base_commit_sha: baseCommitSha,
      repair_branch: repairBranch,
      status: "ready" as WorkspaceStatus,
      created_by: userId,
      created_at: now,
      last_activity_at: now,
      expires_at: expiresAt,
      stopped_at: null,
    };

    InMemoryDatabase.getInstance().workspaces.set(workspaceId, workspace);

    await AuditLogger.log({
      organizationId: input.organizationId,
      projectId: project.id,
      workspaceId,
      userId,
      eventType: "workspace.created",
      metadata: { sandboxId: sandboxInstance.id, repairBranch, baseCommitSha },
    });

    return workspace;
  }

  public static async getWorkspace(userId: string, organizationId: string, workspaceId: string) {
    await AuthGuard.assertPermission(userId, organizationId, "workspace:view");
    const workspace = InMemoryDatabase.getInstance().workspaces.get(workspaceId);

    if (!workspace || workspace.organization_id !== organizationId) {
      throw new NotFoundError("Workspace", workspaceId);
    }

    return workspace;
  }

  public static async executeCommand(
    userId: string,
    organizationId: string,
    workspaceId: string,
    sandboxProvider: SandboxProvider,
    commandType: CommandType,
    customCommandString?: string
  ) {
    await AuthGuard.assertPermission(userId, organizationId, "workspace:execute_command");
    const workspace = await this.getWorkspace(userId, organizationId, workspaceId);
    const project = await ProjectService.getProject(userId, organizationId, workspace.project_id);

    // 1. Security check and resolve against allowlist
    const resolved = validateAndResolveCommand(commandType, customCommandString, {
      installCommand: project.install_command,
      testCommand: project.test_command,
      lintCommand: project.lint_command,
      typecheckCommand: project.typecheck_command,
      buildCommand: project.build_command,
      devCommand: project.dev_command,
    });

    const runId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const startedAt = new Date().toISOString();

    // 2. Execute inside sandbox
    const result = await sandboxProvider.executeCommand(
      workspace.sandbox_id || workspace.id,
      resolved.binary,
      resolved.args
    );

    const completedAt = new Date().toISOString();
    const isSuccess = result.exitCode === 0;

    const commandRun = {
      id: runId,
      workspace_id: workspaceId,
      command_type: commandType,
      command_display: resolved.resolvedCommand,
      status: isSuccess ? "passed" : "failed",
      exit_code: result.exitCode,
      stdout_excerpt: result.stdout,
      stderr_excerpt: result.stderr,
      started_at: startedAt,
      completed_at: completedAt,
      triggered_by: userId,
    };

    InMemoryDatabase.getInstance().commandRuns.set(runId, commandRun);

    // Update workspace last activity
    workspace.last_activity_at = completedAt;

    await AuditLogger.log({
      organizationId,
      projectId: project.id,
      workspaceId,
      userId,
      eventType: "workspace.command_executed",
      metadata: {
        command: resolved.resolvedCommand,
        exitCode: result.exitCode,
        durationMs: result.durationMs,
      },
    });

    return commandRun;
  }

  public static async updateStatus(
    userId: string,
    organizationId: string,
    workspaceId: string,
    nextStatus: WorkspaceStatus,
    context?: { validationPassed?: boolean; humanApproved?: boolean }
  ) {
    const workspace = await this.getWorkspace(userId, organizationId, workspaceId);
    const updatedStatus = WorkspaceStateMachine.transition(workspace.status, nextStatus, context);
    workspace.status = updatedStatus;
    workspace.last_activity_at = new Date().toISOString();

    await AuditLogger.log({
      organizationId,
      projectId: workspace.project_id,
      workspaceId,
      userId,
      eventType: "workspace.status_changed",
      metadata: { from: workspace.status, to: updatedStatus },
    });

    return workspace;
  }

  public static async stopWorkspace(
    userId: string,
    organizationId: string,
    workspaceId: string,
    sandboxProvider: SandboxProvider
  ) {
    await AuthGuard.assertPermission(userId, organizationId, "workspace:stop");
    const workspace = await this.getWorkspace(userId, organizationId, workspaceId);

    if (workspace.sandbox_id) {
      await sandboxProvider.stopSandbox(workspace.sandbox_id);
    }

    workspace.status = "stopped";
    workspace.stopped_at = new Date().toISOString();

    await AuditLogger.log({
      organizationId,
      projectId: workspace.project_id,
      workspaceId,
      userId,
      eventType: "workspace.stopped",
      metadata: {},
    });

    return workspace;
  }
}
