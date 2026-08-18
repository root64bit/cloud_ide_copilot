import { assertSafeRepairBranch } from "@/lib/security/branch-guard";
import { App } from "@octokit/app";
import { Octokit } from "@octokit/rest";
import type {
  CreateBranchOptions,
  CreatePullRequestOptions,
  GitCommit,
  GitProvider,
  GitRepository,
  PullRequestResult,
} from "./git.interface";

function normalizePrivateKey(value?: string): string | undefined {
  return value?.replace(/\\n/g, "\n").trim() || undefined;
}

export class GitHubAppProvider implements GitProvider {
  private app: App;

  constructor() {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = normalizePrivateKey(process.env.GITHUB_APP_PRIVATE_KEY);
    if (!appId || !privateKey) {
      throw new Error("GITHUB_APP_NOT_CONFIGURED: GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY are required");
    }

    const clientId = process.env.GITHUB_APP_CLIENT_ID;
    const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
    const options: any = { appId, privateKey };
    if (clientId && clientSecret) {
      options.oauth = { clientId, clientSecret };
    }
    this.app = new App(options);
  }

  private assertInstallationId(installationId?: number): asserts installationId is number {
    if (!installationId || !Number.isInteger(installationId) || installationId <= 0) {
      throw new Error("GITHUB_INSTALLATION_REQUIRED: a valid GitHub App installation ID is required");
    }
  }

  private async getInstallationOctokit(installationId?: number): Promise<Octokit> {
    this.assertInstallationId(installationId);
    return (await this.app.getInstallationOctokit(installationId)) as unknown as Octokit;
  }

  async getInstallationAccessToken(installationId: number): Promise<string> {
    this.assertInstallationId(installationId);
    const response = await (this.app as any).octokit.request(
      "POST /app/installations/{installation_id}/access_tokens",
      { installation_id: installationId }
    );
    const token = response?.data?.token;
    if (!token) throw new Error("GitHub did not return an installation access token");
    return token;
  }

  async listRepositories(installationId: number): Promise<GitRepository[]> {
    const octokit = await this.getInstallationOctokit(installationId);
    const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({ per_page: 100 });
    return data.repositories.map((repo) => ({
      id: repo.id,
      owner: repo.owner.login,
      name: repo.name,
      fullName: repo.full_name,
      defaultBranch: repo.default_branch,
      isPrivate: repo.private,
      htmlUrl: repo.html_url,
      cloneUrl: repo.clone_url,
    }));
  }

  async getRepository(owner: string, repo: string, installationId?: number): Promise<GitRepository> {
    const octokit = await this.getInstallationOctokit(installationId);
    const { data } = await octokit.rest.repos.get({ owner, repo });
    return {
      id: data.id,
      owner: data.owner.login,
      name: data.name,
      fullName: data.full_name,
      defaultBranch: data.default_branch,
      isPrivate: data.private,
      htmlUrl: data.html_url,
      cloneUrl: data.clone_url,
    };
  }

  async getLatestCommit(owner: string, repo: string, branch = "main", installationId?: number): Promise<GitCommit> {
    const octokit = await this.getInstallationOctokit(installationId);
    const { data } = await octokit.rest.repos.getCommit({ owner, repo, ref: branch });
    return {
      sha: data.sha,
      message: data.commit.message,
      author: data.commit.author?.name || "Unknown",
      date: data.commit.author?.date || new Date().toISOString(),
    };
  }

  async createBranch(options: CreateBranchOptions, installationId?: number): Promise<{ ref: string; sha: string }> {
    assertSafeRepairBranch(options.newBranch, options.baseBranch);
    const octokit = await this.getInstallationOctokit(installationId);
    const { data: baseRef } = await octokit.rest.git.getRef({
      owner: options.owner,
      repo: options.repo,
      ref: `heads/${options.baseBranch}`,
    });
    const { data: newRef } = await octokit.rest.git.createRef({
      owner: options.owner,
      repo: options.repo,
      ref: `refs/heads/${options.newBranch}`,
      sha: baseRef.object.sha,
    });
    return { ref: newRef.ref, sha: newRef.object.sha };
  }

  async createPullRequest(options: CreatePullRequestOptions, installationId?: number): Promise<PullRequestResult> {
    assertSafeRepairBranch(options.headBranch, options.baseBranch);
    const octokit = await this.getInstallationOctokit(installationId);
    const { data } = await octokit.rest.pulls.create({
      owner: options.owner,
      repo: options.repo,
      title: options.title,
      body: options.body,
      head: options.headBranch,
      base: options.baseBranch,
    });
    return {
      number: data.number,
      id: data.id,
      url: data.url,
      htmlUrl: data.html_url,
      state: data.state as "open" | "closed",
    };
  }

  async mergePullRequest(owner: string, repo: string, prNumber: number, installationId?: number): Promise<{ merged: boolean; sha: string }> {
    const octokit = await this.getInstallationOctokit(installationId);
    const { data } = await octokit.rest.pulls.merge({
      owner,
      repo,
      pull_number: prNumber,
      merge_method: "squash",
    });
    if (!data.merged) throw new Error(data.message || "GitHub refused to merge the pull request");
    return { merged: data.merged, sha: data.sha };
  }
}
