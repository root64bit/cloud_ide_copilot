import type { DeploymentInfo, DeploymentProvider } from "./deployment.interface";

export class VercelDeploymentProvider implements DeploymentProvider {
  private apiToken: string;
  private defaultTeamId?: string;

  constructor() {
    this.apiToken = process.env.VERCEL_API_TOKEN || "mock-vercel-token";
    this.defaultTeamId = process.env.VERCEL_TEAM_ID;
  }

  private getHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      "Content-Type": "application/json",
    };
  }

  async getProject(
    projectId: string,
    teamId?: string
  ): Promise<{ id: string; name: string; domains: string[] }> {
    const tid = teamId || this.defaultTeamId;
    const url = `https://api.vercel.com/v9/projects/${projectId}${tid ? `?teamId=${tid}` : ""}`;

    if (!process.env.VERCEL_API_TOKEN) {
      // Mock fallback
      return {
        id: projectId,
        name: projectId.replace("prj_", ""),
        domains: [`${projectId.replace("prj_", "")}.example.com`],
      };
    }

    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to fetch Vercel project: ${res.statusText}`);
    }
    const data = await res.json();
    return {
      id: data.id,
      name: data.name,
      domains: data.targets?.production?.alias || [],
    };
  }

  async getDeployments(
    projectId: string,
    limit = 10,
    teamId?: string
  ): Promise<DeploymentInfo[]> {
    const tid = teamId || this.defaultTeamId;
    const url = `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=${limit}${
      tid ? `&teamId=${tid}` : ""
    }`;

    if (!process.env.VERCEL_API_TOKEN) {
      return [
        {
          id: "dpl_prod_98234",
          projectId,
          name: "Production Deployment",
          url: `https://${projectId.replace("prj_", "")}.example.com`,
          environment: "production",
          status: "ready",
          branch: "main",
          commitSha: "a9f82d1c5e4b7890123456789abcdef012345678",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          readyAt: new Date(Date.now() - 3500000).toISOString(),
        },
      ];
    }

    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to fetch Vercel deployments: ${res.statusText}`);
    }
    const data = await res.json();

    return (data.deployments || []).map((d: any) => ({
      id: d.uid,
      projectId,
      name: d.name,
      url: `https://${d.url}`,
      environment: d.target === "production" ? "production" : "preview",
      status: d.readyState === "READY" ? "ready" : d.readyState === "ERROR" ? "error" : "building",
      branch: d.meta?.githubCommitRef || "main",
      commitSha: d.meta?.githubCommitSha || "",
      createdAt: new Date(d.createdAt).toISOString(),
      readyAt: d.ready ? new Date(d.ready).toISOString() : undefined,
    }));
  }

  async getDeploymentStatus(deploymentId: string, teamId?: string): Promise<DeploymentInfo> {
    const tid = teamId || this.defaultTeamId;
    const url = `https://api.vercel.com/v13/deployments/${deploymentId}${
      tid ? `?teamId=${tid}` : ""
    }`;

    if (!process.env.VERCEL_API_TOKEN) {
      return {
        id: deploymentId,
        projectId: "prj_onedealer",
        name: "Preview Deployment",
        url: `https://onedealer-preview-${deploymentId}.vercel.app`,
        environment: "preview",
        status: "ready",
        branch: "ai-repair/onedealer-patch-1",
        commitSha: "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
        createdAt: new Date(Date.now() - 120000).toISOString(),
        readyAt: new Date(Date.now() - 60000).toISOString(),
      };
    }

    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to fetch deployment status: ${res.statusText}`);
    }
    const d = await res.json();

    return {
      id: d.id,
      projectId: d.projectId,
      name: d.name,
      url: `https://${d.url}`,
      environment: d.target === "production" ? "production" : "preview",
      status: d.readyState === "READY" ? "ready" : d.readyState === "ERROR" ? "error" : "building",
      branch: d.meta?.githubCommitRef || "main",
      commitSha: d.meta?.githubCommitSha || "",
      createdAt: new Date(d.createdAt).toISOString(),
      readyAt: d.ready ? new Date(d.ready).toISOString() : undefined,
    };
  }

  async getPreviewUrl(projectId: string, branchName: string, teamId?: string): Promise<string | null> {
    const deployments = await this.getDeployments(projectId, 10, teamId);
    const match = deployments.find(
      (d) => d.branch === branchName && (d.status === "ready" || d.status === "building")
    );
    return match ? match.url : null;
  }
}
