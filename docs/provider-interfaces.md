# Provider Interfaces & Extensibility

All third-party systems are decoupled behind TypeScript interfaces to ensure future provider replacement without rewriting the SaaS platform.

---

## 1. `GitProvider` (`src/server/providers/git/git.interface.ts`)
```ts
export interface GitProvider {
  listRepositories(installationId: number): Promise<GitRepository[]>;
  getRepository(owner: string, repo: string, installationId?: number): Promise<GitRepository>;
  getLatestCommit(owner: string, repo: string, branch?: string, installationId?: number): Promise<GitCommit>;
  createBranch(options: CreateBranchOptions, installationId?: number): Promise<{ ref: string; sha: string }>;
  createPullRequest(options: CreatePullRequestOptions, installationId?: number): Promise<PullRequestResult>;
  mergePullRequest(owner: string, repo: string, prNumber: number, installationId?: number): Promise<{ merged: boolean; sha: string }>;
}
```
- **Primary**: `GitHubAppProvider` (`@octokit/app`, `@octokit/rest`)
- **Testing**: `MockGitProvider`

---

## 2. `DeploymentProvider` (`src/server/providers/deployment/deployment.interface.ts`)
```ts
export interface DeploymentProvider {
  getProject(projectId: string, teamId?: string): Promise<{ id: string; name: string; domains: string[] }>;
  getDeployments(projectId: string, limit?: number, teamId?: string): Promise<DeploymentInfo[]>;
  getDeploymentStatus(deploymentId: string, teamId?: string): Promise<DeploymentInfo>;
  getPreviewUrl(projectId: string, branchName: string, teamId?: string): Promise<string | null>;
}
```
- **Primary**: `VercelDeploymentProvider`

---

## 3. `IncidentProvider` (`src/server/providers/incident/incident.interface.ts`)
```ts
export interface IncidentProvider {
  verifyWebhook(rawPayload: string | Buffer, signatureHeader: string | null): boolean;
  normalizeWebhook(payload: Record<string, any>): NormalizedIncident;
}
```
- **Primary**: `SentryIncidentProvider`

---

## 4. `AIProvider` (`src/server/providers/ai/ai.interface.ts`)
```ts
export interface AIProvider {
  diagnoseIncident(incidentContext: {
    title: string;
    level: string;
    environment: string;
    stacktrace: Array<{ filename: string; lineno: number; function: string }>;
  }): Promise<IncidentDiagnosis>;

  proposeRepair(context: {
    incidentTitle: string;
    diagnosis: IncidentDiagnosis;
    relevantFiles: Record<string, string>;
  }): Promise<RepairPlan>;

  reviewRepair(context: {
    diff: string;
    testOutput: string;
    incidentTitle: string;
  }): Promise<RiskReview>;
}
```
- **Primary**: `OpenRouterAIProvider` (with multi-tier routing and Zod structured schemas)

---

## 5. `SandboxProvider` (`src/server/providers/sandbox/sandbox.interface.ts`)
```ts
export interface SandboxProvider {
  createSandbox(options: {
    name: string;
    repoOwner: string;
    repoName: string;
    commitSha: string;
    ttlMinutes?: number;
  }): Promise<SandboxInstance>;

  executeCommand(sandboxId: string, command: string, args?: string[], cwd?: string): Promise<SandboxExecutionResult>;
  readFile(sandboxId: string, filePath: string): Promise<string>;
  writeFile(sandboxId: string, filePath: string, content: string): Promise<void>;
  stopSandbox(sandboxId: string): Promise<void>;
  getBrowserIdeUrl(sandboxId: string): Promise<string>;
}
```
- **Primary**: `VercelSandboxProvider` (`@vercel/sandbox`)
- **Testing**: `MockSandboxProvider`
- **Future Alternative**: `CubeSandboxProvider`

---

## 6. `CodingAgent` (`src/server/providers/agent/agent.interface.ts`)
```ts
export interface CodingAgent {
  analyzeWorkspace(context: CodingAgentTaskContext): Promise<IncidentDiagnosis>;
  proposePatch(context: CodingAgentTaskContext): Promise<CodingAgentResult>;
  continueTask(workspaceId: string, instruction: string): Promise<CodingAgentResult>;
}
```
- **Primary**: `OpenHandsAgentProvider`

---

## 7. `ProjectMemoryProvider` (`src/server/providers/memory/memory.interface.ts`)
```ts
export interface ProjectMemoryProvider {
  remember(entry: ProjectMemoryEntry): Promise<{ id: string }>;
  search(params: {
    organizationId: string;
    projectId: string;
    query: string;
    limit?: number;
    memoryTypes?: MemoryType[];
  }): Promise<MemorySearchResult[]>;
  getArchitectureContext(organizationId: string, projectId: string): Promise<string>;
}
```
- **Primary**: `DatabaseMemoryProvider` (Scoped PostgreSQL)
- **Phase 2**: `TencentAgentMemoryProvider` (TencentDB Agent Memory)
