export interface SandboxExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface SandboxInstance {
  id: string;
  name: string;
  status: "ready" | "stopped" | "failed";
  createdAt: string;
  expiresAt: string;
}

export interface SandboxProvider {
  createSandbox(options: {
    name: string;
    repoOwner: string;
    repoName: string;
    commitSha: string;
    ttlMinutes?: number;
  }): Promise<SandboxInstance>;

  executeCommand(
    sandboxId: string,
    command: string,
    args?: string[],
    cwd?: string
  ): Promise<SandboxExecutionResult>;

  readFile(sandboxId: string, filePath: string): Promise<string>;
  writeFile(sandboxId: string, filePath: string, content: string): Promise<void>;
  stopSandbox(sandboxId: string): Promise<void>;
  getBrowserIdeUrl(sandboxId: string): Promise<string>;
}
