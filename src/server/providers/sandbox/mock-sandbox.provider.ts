import { truncateOutput } from "@/lib/security/allowlist";
import { redactSecrets } from "@/lib/security/redaction";
import type {
  SandboxExecutionResult,
  SandboxInstance,
  SandboxProvider,
} from "./sandbox.interface";

export class MockSandboxProvider implements SandboxProvider {
  public files = new Map<string, string>();
  public executedCommands: string[] = [];

  constructor() {
    this.files.set(
      "src/lib/checkout/pricing.ts",
      "export function calculateTotal(cart: any) {\n  return cart.items.reduce((sum: number, item: any) => sum + item.price * (1 - item.discountCode.percent), 0);\n}"
    );
  }

  async createSandbox(options: {
    name: string;
    repoOwner: string;
    repoName: string;
    commitSha: string;
    ttlMinutes?: number;
  }): Promise<SandboxInstance> {
    const sandboxId = `mock_sbx_${Date.now()}`;
    return {
      id: sandboxId,
      name: options.name,
      status: "ready",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (options.ttlMinutes || 60) * 60000).toISOString(),
    };
  }

  async executeCommand(
    _sandboxId: string,
    command: string,
    args: string[] = []
  ): Promise<SandboxExecutionResult> {
    const fullCmd = `${command} ${args.join(" ")}`.trim();
    this.executedCommands.push(fullCmd);

    return {
      exitCode: 0,
      stdout: truncateOutput(redactSecrets(`[MOCK SANDBOX] Success: ${fullCmd}`)),
      stderr: "",
      durationMs: 120,
    };
  }

  async readFile(_sandboxId: string, filePath: string): Promise<string> {
    return this.files.get(filePath) || "// Empty mock file";
  }

  async writeFile(_sandboxId: string, filePath: string, content: string): Promise<void> {
    this.files.set(filePath, content);
  }

  async stopSandbox(_sandboxId: string): Promise<void> {
    // Stopped
  }

  async getBrowserIdeUrl(sandboxId: string): Promise<string> {
    return `https://ide.mock.example.com/?sandbox=${sandboxId}`;
  }
}
