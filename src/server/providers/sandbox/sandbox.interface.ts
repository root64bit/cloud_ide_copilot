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

export interface SandboxCreateOptions {
  name: string;
  repoOwner: string;
  repoName: string;
  commitSha: string;
  branch?: string;
  installationToken?: string;
  ttlMinutes?: number;
}

export interface PushRepairBranchOptions {
  repoOwner: string;
  repoName: string;
  branch: string;
  baseBranch: string;
  installationToken: string;
  commitMessage: string;
}

export interface SandboxProvider {
  createSandbox(options: SandboxCreateOptions): Promise<SandboxInstance>;

  executeCommand(
    sandboxId: string,
    command: string,
    args?: string[],
    cwd?: string
  ): Promise<SandboxExecutionResult>;

  readFile(sandboxId: string, filePath: string): Promise<string>;
  writeFile(sandboxId: string, filePath: string, content: string): Promise<void>;
  pushRepairBranch?(
    sandboxId: string,
    options: PushRepairBranchOptions
  ): Promise<{ commitSha: string; branch: string }>;
  stopSandbox(sandboxId: string): Promise<void>;
  getBrowserIdeUrl(sandboxId: string): Promise<string>;
}
