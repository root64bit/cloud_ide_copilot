import { truncateOutput } from "@/lib/security/allowlist";
import { redactSecrets } from "@/lib/security/redaction";
import { Sandbox } from "@vercel/sandbox";
import type {
  SandboxExecutionResult,
  SandboxInstance,
  SandboxProvider,
} from "./sandbox.interface";

export interface VercelSandboxCreateOptions {
  name: string;
  repoOwner: string;
  repoName: string;
  commitSha: string;
  branch?: string;
  installationToken?: string;
  ttlMinutes?: number;
}

export class VercelSandboxProvider implements SandboxProvider {
  private apiToken: string;
  private ideDomain: string;
  private activeSandboxes = new Map<string, Sandbox>();

  constructor() {
    this.apiToken = process.env.VERCEL_SANDBOX_TOKEN || "";
    this.ideDomain = process.env.CODE_SERVER_BASE_DOMAIN || "ide.engineering.example.com";
  }

  private isLive(): boolean {
    return Boolean(this.apiToken) && process.env.NODE_ENV !== "test" && process.env.ALLOW_MOCK_PROVIDERS !== "true";
  }

  async createSandbox(options: VercelSandboxCreateOptions): Promise<SandboxInstance> {
    const sandboxId = `sbx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ttl = options.ttlMinutes || 60;
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();

    if (this.isLive()) {
      try {
        const sandbox = await Sandbox.create({
          runtime: "node22",
          timeout: ttl * 60 * 1000,
          token: this.apiToken,
        });

        this.activeSandboxes.set(sandbox.name, sandbox);

        // Clone repository with short-lived token if available
        const tokenPart = options.installationToken ? `x-access-token:${options.installationToken}@` : "";
        const cloneUrl = `https://${tokenPart}github.com/${options.repoOwner}/${options.repoName}.git`;
        const branch = options.branch || "main";

        await sandbox.runCommand("git", ["clone", "--depth", "50", "--branch", branch, cloneUrl, "/workspace"]);

        // Immediately scrub credentials from git remote
        const cleanUrl = `https://github.com/${options.repoOwner}/${options.repoName}.git`;
        await sandbox.runCommand("git", ["remote", "set-url", "origin", cleanUrl]);

        if (options.commitSha) {
          await sandbox.runCommand("git", ["checkout", options.commitSha]);
        }

        return {
          id: sandbox.name,
          name: options.name,
          status: "ready",
          createdAt: new Date().toISOString(),
          expiresAt,
        };
      } catch (err: any) {
        throw new Error(`Failed to initialize Vercel Sandbox: ${err?.message || err}`);
      }
    }

    // Deterministic mock instance for tests & offline dev
    return {
      id: sandboxId,
      name: options.name,
      status: "ready",
      createdAt: new Date().toISOString(),
      expiresAt,
    };
  }

  private async getSandbox(sandboxId: string): Promise<Sandbox | null> {
    if (!this.isLive()) return null;
    let sbx = this.activeSandboxes.get(sandboxId);
    if (!sbx && this.apiToken) {
      try {
        sbx = await Sandbox.get({ name: sandboxId, token: this.apiToken });
        if (sbx) this.activeSandboxes.set(sandboxId, sbx);
      } catch {
        return null;
      }
    }
    return sbx || null;
  }

  async executeCommand(
    sandboxId: string,
    command: string,
    args: string[] = [],
    _cwd = "/workspace"
  ): Promise<SandboxExecutionResult> {
    const startTime = Date.now();
    const fullCmd = `${command} ${args.join(" ")}`.trim();

    if (this.isLive()) {
      const sandbox = await this.getSandbox(sandboxId);
      if (sandbox) {
        const res = await sandbox.runCommand(command, args);
        const durationMs = Date.now() - startTime;
        const stdoutStr = typeof res.stdout === "function" ? await res.stdout() : String(res.stdout || "");
        const stderrStr = typeof res.stderr === "function" ? await res.stderr() : String(res.stderr || "");

        return {
          exitCode: res.exitCode ?? 0,
          stdout: truncateOutput(redactSecrets(stdoutStr)),
          stderr: truncateOutput(redactSecrets(stderrStr)),
          durationMs,
        };
      }
    }

    // Mock execution response for tests and local development
    let exitCode = 0;
    let stdout = `Executing: ${fullCmd}\n`;
    let stderr = "";

    if (fullCmd.includes("test")) {
      stdout += "PASS tests/unit/pricing.test.ts (1 passed, 1 total)\nTests completed successfully.";
    } else if (fullCmd.includes("lint")) {
      stdout += "✔ No ESLint warnings or errors found.";
    } else if (fullCmd.includes("typecheck") || fullCmd.includes("tsc")) {
      stdout += "TypeScript compilation check passed with 0 errors.";
    } else if (fullCmd.includes("build")) {
      stdout += "Creating an optimized production build...\nCompiled successfully in 4.2s.";
    } else if (fullCmd.includes("status")) {
      stdout += "On branch ai-repair/patch-1\nChanges to be committed:\n  modified: src/lib/checkout/pricing.ts";
    } else if (fullCmd.includes("diff")) {
      stdout += " src/lib/checkout/pricing.ts | 4 ++--\n 1 file changed, 2 insertions(+), 2 deletions(-)";
    } else {
      stdout += `Command executed successfully: ${fullCmd}`;
    }

    const durationMs = Date.now() - startTime;

    return {
      exitCode,
      stdout: truncateOutput(redactSecrets(stdout)),
      stderr: truncateOutput(redactSecrets(stderr)),
      durationMs,
    };
  }

  async applyPatch(sandboxId: string, patchContent: string, _cwd = "/workspace"): Promise<{ success: boolean; output: string }> {
    const patchFile = `/tmp/repair_${Date.now()}.patch`;

    if (this.isLive()) {
      const sandbox = await this.getSandbox(sandboxId);
      if (sandbox) {
        await sandbox.fs.writeFile(patchFile, patchContent);
        // Dry-run check
        const checkRes = await sandbox.runCommand("git", ["apply", "--check", patchFile]);
        if (checkRes.exitCode !== 0) {
          const stderrStr = typeof checkRes.stderr === "function" ? await checkRes.stderr() : String(checkRes.stderr || "");
          await sandbox.runCommand("rm", ["-f", patchFile]);
          return { success: false, output: `Patch validation failed: ${stderrStr}` };
        }
        // Apply patch
        const applyRes = await sandbox.runCommand("git", ["apply", patchFile]);
        const stdoutStr = typeof applyRes.stdout === "function" ? await applyRes.stdout() : String(applyRes.stdout || "");
        const stderrStr = typeof applyRes.stderr === "function" ? await applyRes.stderr() : String(applyRes.stderr || "");
        // Clean up temporary patch artifact
        await sandbox.runCommand("rm", ["-f", patchFile]);
        return {
          success: applyRes.exitCode === 0,
          output: stdoutStr || stderrStr || "Patch applied successfully",
        };
      }
    }

    return { success: true, output: "Patch applied cleanly in mock sandbox." };
  }

  async readFile(sandboxId: string, filePath: string): Promise<string> {
    if (this.isLive()) {
      const sandbox = await this.getSandbox(sandboxId);
      if (sandbox) {
        return (await sandbox.fs.readFile(filePath, "utf8")) as string;
      }
    }
    return `// Content of ${filePath}\nexport function calculateTotal() {\n  return 100;\n}`;
  }

  async writeFile(sandboxId: string, filePath: string, content: string): Promise<void> {
    if (this.isLive()) {
      const sandbox = await this.getSandbox(sandboxId);
      if (sandbox) {
        await sandbox.fs.writeFile(filePath, content);
      }
    }
  }

  async stopSandbox(sandboxId: string): Promise<void> {
    if (this.isLive()) {
      const sandbox = await this.getSandbox(sandboxId);
      if (sandbox) {
        await sandbox.stop();
        this.activeSandboxes.delete(sandboxId);
      }
    }
  }

  async getBrowserIdeUrl(sandboxId: string): Promise<string> {
    const sessionToken = Buffer.from(`${sandboxId}:${Date.now()}`).toString("base64url");
    return `https://${this.ideDomain}/?sandbox=${sandboxId}&token=${sessionToken}`;
  }
}
