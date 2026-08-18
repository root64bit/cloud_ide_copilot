import { truncateOutput } from "@/lib/security/allowlist";
import { assertSafeRepairBranch } from "@/lib/security/branch-guard";
import { redactSecrets } from "@/lib/security/redaction";
import { Sandbox } from "@vercel/sandbox";
import path from "node:path";
import type {
  PushRepairBranchOptions,
  SandboxCreateOptions,
  SandboxExecutionResult,
  SandboxInstance,
  SandboxProvider,
} from "./sandbox.interface";

const SANDBOX_ROOT = "/vercel/sandbox";
const MAX_TTL_MINUTES = 24 * 60;

function isMockMode(): boolean {
  return process.env.NODE_ENV === "test" || (process.env.NODE_ENV !== "production" && process.env.ALLOW_MOCK_PROVIDERS === "true");
}

function validateSandboxName(name: string): string {
  const normalized = name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 63);
  if (!normalized) throw new Error("Invalid sandbox name");
  return normalized;
}

function assertSafeWorkspacePath(filePath: string): string {
  const candidate = path.posix.isAbsolute(filePath)
    ? path.posix.normalize(filePath)
    : path.posix.normalize(path.posix.join(SANDBOX_ROOT, filePath));

  if (candidate !== SANDBOX_ROOT && !candidate.startsWith(`${SANDBOX_ROOT}/`)) {
    throw new Error("Sandbox path escapes the workspace root");
  }
  return candidate;
}

function getExternalAuthOptions(): Record<string, string> {
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token) return {};
  if (!teamId || !projectId) {
    throw new Error("VERCEL_TOKEN requires VERCEL_TEAM_ID and VERCEL_PROJECT_ID for Sandbox access");
  }
  return { token, teamId, projectId };
}

async function commandOutput(result: any): Promise<{ stdout: string; stderr: string }> {
  const stdout = typeof result.stdout === "function" ? await result.stdout() : String(result.stdout || "");
  const stderr = typeof result.stderr === "function" ? await result.stderr() : String(result.stderr || "");
  return { stdout, stderr };
}

export class VercelSandboxProvider implements SandboxProvider {
  private activeSandboxes = new Map<string, Sandbox>();

  async createSandbox(options: SandboxCreateOptions): Promise<SandboxInstance> {
    const ttlMinutes = Math.min(Math.max(options.ttlMinutes || 60, 5), MAX_TTL_MINUTES);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();

    if (isMockMode()) {
      return {
        id: `mock_sbx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: options.name,
        status: "ready",
        createdAt: new Date().toISOString(),
        expiresAt,
      };
    }

    const source: any = {
      type: "git",
      url: `https://github.com/${options.repoOwner}/${options.repoName}.git`,
      depth: 50,
    };
    if (options.installationToken) {
      source.username = "x-access-token";
      source.password = options.installationToken;
    }

    const sandbox = await Sandbox.create({
      ...getExternalAuthOptions(),
      name: validateSandboxName(options.name),
      runtime: "node22",
      timeout: ttlMinutes * 60_000,
      persistent: true,
      ports: [3000, 8080],
      source,
    } as any);

    const sandboxId = (sandbox as any).sandboxId || (sandbox as any).name;
    if (!sandboxId) {
      await sandbox.stop().catch(() => undefined);
      throw new Error("Vercel Sandbox did not return a sandbox identifier");
    }
    this.activeSandboxes.set(sandboxId, sandbox);

    try {
      // Ensure the repository starts from the exact audited commit, not merely the branch head.
      if (options.commitSha) {
        const checkout = await sandbox.runCommand({
          cmd: "git",
          args: ["checkout", "--detach", options.commitSha],
          cwd: SANDBOX_ROOT,
        } as any);
        if (checkout.exitCode !== 0) {
          const { stderr } = await commandOutput(checkout);
          throw new Error(`Unable to checkout base commit: ${stderr}`);
        }
      }

      // Never retain the short-lived credential in repository configuration.
      const cleanRemote = await sandbox.runCommand({
        cmd: "git",
        args: ["remote", "set-url", "origin", `https://github.com/${options.repoOwner}/${options.repoName}.git`],
        cwd: SANDBOX_ROOT,
      } as any);
      if (cleanRemote.exitCode !== 0) {
        throw new Error("Unable to scrub GitHub credentials from sandbox Git remote");
      }
    } catch (error) {
      await sandbox.stop().catch(() => undefined);
      throw error;
    }

    return {
      id: sandboxId,
      name: options.name,
      status: "ready",
      createdAt: new Date().toISOString(),
      expiresAt,
    };
  }

  private async getSandbox(sandboxId: string): Promise<Sandbox> {
    if (isMockMode()) throw new Error("Mock sandbox instances do not have a Vercel runtime");
    const cached = this.activeSandboxes.get(sandboxId);
    if (cached) return cached;

    const sandbox = await Sandbox.get({
      ...getExternalAuthOptions(),
      sandboxId,
    } as any);
    this.activeSandboxes.set(sandboxId, sandbox);
    return sandbox;
  }

  async executeCommand(
    sandboxId: string,
    command: string,
    args: string[] = [],
    cwd = SANDBOX_ROOT
  ): Promise<SandboxExecutionResult> {
    const startTime = Date.now();
    if (isMockMode()) {
      return {
        exitCode: 0,
        stdout: truncateOutput(`[MOCK SANDBOX] ${command} ${args.join(" ")}`.trim()),
        stderr: "",
        durationMs: Date.now() - startTime,
      };
    }

    const sandbox = await this.getSandbox(sandboxId);
    const result = await sandbox.runCommand({
      cmd: command,
      args,
      cwd: assertSafeWorkspacePath(cwd),
    } as any);
    const output = await commandOutput(result);

    return {
      exitCode: result.exitCode ?? 1,
      stdout: truncateOutput(redactSecrets(output.stdout)),
      stderr: truncateOutput(redactSecrets(output.stderr)),
      durationMs: Date.now() - startTime,
    };
  }

  async applyPatch(sandboxId: string, patchContent: string, cwd = SANDBOX_ROOT): Promise<{ success: boolean; output: string }> {
    if (isMockMode()) return { success: true, output: "Patch applied in explicit mock mode." };
    const sandbox = await this.getSandbox(sandboxId);
    const patchPath = `/tmp/repair_${crypto.randomUUID()}.patch`;
    await (sandbox as any).writeFiles([{ path: patchPath, content: Buffer.from(patchContent, "utf8"), mode: 0o600 }]);

    try {
      const safeCwd = assertSafeWorkspacePath(cwd);
      const check = await sandbox.runCommand({ cmd: "git", args: ["apply", "--check", patchPath], cwd: safeCwd } as any);
      if (check.exitCode !== 0) {
        const { stderr } = await commandOutput(check);
        return { success: false, output: truncateOutput(redactSecrets(stderr || "Patch validation failed")) };
      }
      const apply = await sandbox.runCommand({ cmd: "git", args: ["apply", patchPath], cwd: safeCwd } as any);
      const { stdout, stderr } = await commandOutput(apply);
      return {
        success: apply.exitCode === 0,
        output: truncateOutput(redactSecrets(stdout || stderr || "Patch applied successfully")),
      };
    } finally {
      await sandbox.runCommand({ cmd: "rm", args: ["-f", patchPath], cwd: SANDBOX_ROOT } as any).catch(() => undefined);
    }
  }

  async readFile(sandboxId: string, filePath: string): Promise<string> {
    if (isMockMode()) return `// mock file: ${filePath}`;
    const sandbox = await this.getSandbox(sandboxId);
    const buffer = await (sandbox as any).readFileToBuffer({ path: assertSafeWorkspacePath(filePath) });
    return Buffer.from(buffer).toString("utf8");
  }

  async writeFile(sandboxId: string, filePath: string, content: string): Promise<void> {
    if (isMockMode()) return;
    const sandbox = await this.getSandbox(sandboxId);
    await (sandbox as any).writeFiles([
      { path: assertSafeWorkspacePath(filePath), content: Buffer.from(content, "utf8"), mode: 0o644 },
    ]);
  }

  async pushRepairBranch(
    sandboxId: string,
    options: PushRepairBranchOptions
  ): Promise<{ commitSha: string; branch: string }> {
    assertSafeRepairBranch(options.branch, options.baseBranch);
    if (!options.installationToken) throw new Error("A short-lived GitHub installation token is required to push a repair branch");

    if (isMockMode()) {
      return { commitSha: "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0", branch: options.branch };
    }

    const sandbox = await this.getSandbox(sandboxId);
    const status = await sandbox.runCommand({ cmd: "git", args: ["status", "--porcelain"], cwd: SANDBOX_ROOT } as any);
    const { stdout: statusOut } = await commandOutput(status);
    if (!statusOut.trim()) throw new Error("No repair changes exist in the sandbox to push");

    // Reject accidental secret/environment/private-key files before staging.
    const dangerous = statusOut
      .split("\n")
      .map((line) => line.slice(3).trim())
      .filter(Boolean)
      .filter((file) => /(^|\/)(\.env($|\.)|.*\.(pem|key|p12|pfx)$|credentials.*\.json$|service-account.*\.json$)/i.test(file));
    if (dangerous.length) {
      throw new Error(`Refusing to push sensitive file changes: ${dangerous.join(", ")}`);
    }

    await sandbox.runCommand({ cmd: "git", args: ["checkout", "-B", options.branch], cwd: SANDBOX_ROOT } as any);
    await sandbox.runCommand({ cmd: "git", args: ["config", "user.name", "Cloud IDE Copilot Repair Bot"], cwd: SANDBOX_ROOT } as any);
    await sandbox.runCommand({ cmd: "git", args: ["config", "user.email", "repair-bot@users.noreply.github.com"], cwd: SANDBOX_ROOT } as any);
    await sandbox.runCommand({ cmd: "git", args: ["add", "-A"], cwd: SANDBOX_ROOT } as any);

    const commit = await sandbox.runCommand({ cmd: "git", args: ["commit", "-m", options.commitMessage], cwd: SANDBOX_ROOT } as any);
    if (commit.exitCode !== 0) {
      const { stderr } = await commandOutput(commit);
      throw new Error(`Unable to commit repair changes: ${redactSecrets(stderr)}`);
    }

    const authenticatedRemote = `https://x-access-token:${options.installationToken}@github.com/${options.repoOwner}/${options.repoName}.git`;
    const cleanRemote = `https://github.com/${options.repoOwner}/${options.repoName}.git`;
    try {
      await sandbox.runCommand({ cmd: "git", args: ["remote", "set-url", "origin", authenticatedRemote], cwd: SANDBOX_ROOT } as any);
      const push = await sandbox.runCommand({
        cmd: "git",
        args: ["push", "--set-upstream", "origin", `HEAD:refs/heads/${options.branch}`],
        cwd: SANDBOX_ROOT,
      } as any);
      if (push.exitCode !== 0) {
        const { stderr } = await commandOutput(push);
        throw new Error(`Unable to push repair branch: ${redactSecrets(stderr)}`);
      }
    } finally {
      await sandbox.runCommand({ cmd: "git", args: ["remote", "set-url", "origin", cleanRemote], cwd: SANDBOX_ROOT } as any).catch(() => undefined);
    }

    const rev = await sandbox.runCommand({ cmd: "git", args: ["rev-parse", "HEAD"], cwd: SANDBOX_ROOT } as any);
    const { stdout } = await commandOutput(rev);
    return { commitSha: stdout.trim(), branch: options.branch };
  }

  async stopSandbox(sandboxId: string): Promise<void> {
    if (isMockMode()) return;
    const sandbox = await this.getSandbox(sandboxId);
    await sandbox.stop();
    this.activeSandboxes.delete(sandboxId);
  }

  async getBrowserIdeUrl(_sandboxId: string): Promise<string> {
    throw new Error("CODE_SERVER_NOT_WIRED: browser IDE access has not been configured yet");
  }
}
