import type { DeploymentInfo, DeploymentProvider } from "./deployment.interface";

function isMockMode(): boolean {
  return process.env.NODE_ENV === "test" || (process.env.NODE_ENV !== "production" && process.env.ALLOW_MOCK_PROVIDERS === "true");
}

export class VercelDeploymentProvider implements DeploymentProvider {
  private apiToken: string | undefined;
  private defaultTeamId?: string;

  constructor() {
    this.apiToken = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN;
    this.defaultTeamId = process.env.VERCEL_TEAM_ID;
  }

  private assertConfigured(): string {
    if (isMockMode()) return "mock";
    if (!this.apiToken) {
      throw new Error("VERCEL_DEPLOYMENT_API_NOT_CONFIGURED: set VERCEL_TOKEN for deployment discovery");
    }
    return this.apiToken;
  }

  private getHeaders(): HeadersInit {
    const token = this.assertConfigured();
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  }

  async getProject(projectId: string, teamId?: string): Promise<{ id: string; name: string; domains: string[] }> {
    if (isMockMode()) {
      return { id: projectId, name: projectId.replace("prj_", ""), domains: [`${projectId.replace("prj_", "")}.example.com`] };
    }
    const tid = teamId || this.defaultTeamId;
    const params = new URLSearchParams();
    if (tid) params.set("teamId", tid);
    const url = `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}${params.size ? `?${params}` : ""}`;
    const res = await fetch(url, { headers: this.getHeaders(), cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch Vercel project (${res.status})`);
    const data: any = await res.json();
    return { id: data.id, name: data.name, domains: data.targets?.production?.alias || [] };
  }

  async getDeployments(projectId: string, limit = 10, teamId?: string): Promise<DeploymentInfo[]> {
    if (isMockMode()) {
      return [{
        id: "dpl_mock_preview",
        projectId,
        name: "Mock Preview Deployment",
        url: "https://mock-preview.vercel.app",
        environment: "preview",
        status: "ready",
        branch: "ai-repair/mock-fix",
        commitSha: "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
        createdAt: new Date().toISOString(),
        readyAt: new Date().toISOString(),
      }];
    }
    const tid = teamId || this.defaultTeamId;
    const params = new URLSearchParams({ projectId, limit: String(Math.min(Math.max(limit, 1), 100)) });
    if (tid) params.set("teamId", tid);
    const res = await fetch(`https://api.vercel.com/v6/deployments?${params}`, { headers: this.getHeaders(), cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch Vercel deployments (${res.status})`);
    const data: any = await res.json();
    return (data.deployments || []).map((d: any) => ({
      id: d.uid,
      projectId,
      name: d.name,
      url: d.url ? `https://${d.url}` : "",
      environment: d.target === "production" ? "production" : "preview",
      status: d.readyState === "READY" ? "ready" : d.readyState === "ERROR" ? "error" : d.readyState === "CANCELED" ? "canceled" : "building",
      branch: d.meta?.githubCommitRef || "",
      commitSha: d.meta?.githubCommitSha || "",
      createdAt: new Date(d.createdAt).toISOString(),
      readyAt: d.ready ? new Date(d.ready).toISOString() : undefined,
    }));
  }

  async getDeploymentStatus(deploymentId: string, teamId?: string): Promise<DeploymentInfo> {
    if (isMockMode()) {
      return {
        id: deploymentId,
        projectId: "mock-project",
        name: "Mock Preview Deployment",
        url: "https://mock-preview.vercel.app",
        environment: "preview",
        status: "ready",
        branch: "ai-repair/mock-fix",
        commitSha: "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
        createdAt: new Date().toISOString(),
        readyAt: new Date().toISOString(),
      };
    }
    const tid = teamId || this.defaultTeamId;
    const params = new URLSearchParams();
    if (tid) params.set("teamId", tid);
    const res = await fetch(`https://api.vercel.com/v13/deployments/${encodeURIComponent(deploymentId)}${params.size ? `?${params}` : ""}`, {
      headers: this.getHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Failed to fetch Vercel deployment (${res.status})`);
    const d: any = await res.json();
    return {
      id: d.id,
      projectId: d.projectId,
      name: d.name,
      url: d.url ? `https://${d.url}` : "",
      environment: d.target === "production" ? "production" : "preview",
      status: d.readyState === "READY" ? "ready" : d.readyState === "ERROR" ? "error" : d.readyState === "CANCELED" ? "canceled" : "building",
      branch: d.meta?.githubCommitRef || "",
      commitSha: d.meta?.githubCommitSha || "",
      createdAt: new Date(d.createdAt).toISOString(),
      readyAt: d.ready ? new Date(d.ready).toISOString() : undefined,
    };
  }

  async getPreviewUrl(projectId: string, branchName: string, teamId?: string): Promise<string | null> {
    const deployments = await this.getDeployments(projectId, 25, teamId);
    const match = deployments.find((d) => d.environment === "preview" && d.branch === branchName && (d.status === "ready" || d.status === "building"));
    return match?.url || null;
  }
}
