export interface DeploymentInfo {
  id: string;
  projectId: string;
  name: string;
  url: string;
  environment: "production" | "preview" | "staging";
  status: "building" | "ready" | "error" | "canceled";
  branch: string;
  commitSha: string;
  createdAt: string;
  readyAt?: string;
}

export interface DeploymentProvider {
  getProject(projectId: string, teamId?: string): Promise<{ id: string; name: string; domains: string[] }>;
  getDeployments(projectId: string, limit?: number, teamId?: string): Promise<DeploymentInfo[]>;
  getDeploymentStatus(deploymentId: string, teamId?: string): Promise<DeploymentInfo>;
  getPreviewUrl(projectId: string, branchName: string, teamId?: string): Promise<string | null>;
}
