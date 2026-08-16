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

export class GitHubAppProvider implements GitProvider {
  private app: App | null = null;

  constructor() {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
    const clientId = process.env.GITHUB_APP_CLIENT_ID;

    if (appId && privateKey) {
      this.app = new App({
        appId: Number(appId),
        privateKey,
        oauth: {
          clientId: clientId || "",
          clientSecret: clientSecret || "",
        },
      });
    }
  }

  private async getInstallationOctokit(installationId?: number): Promise<Octokit> {
    if (!this.app || !installationId) {
      // Fallback for mock/local test environments if credentials are not configured
      return new Octokit();
    }
    return (await this.app.getInstallationOctokit(installationId)) as unknown as Octokit;
  }

  async listRepositories(installationId: number): Promise<GitRepository[]> {
    const octokit = await this.getInstallationOctokit(installationId);
    const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
      per_page: 100,
    });

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

  async getLatestCommit(
    owner: string,
    repo: string,
    branch = "main",
    installationId?: number
  ): Promise<GitCommit> {
    const octokit = await this.getInstallationOctokit(installationId);
    const { data } = await octokit.rest.repos.getCommit({ owner, repo, ref: branch });

    return {
      sha: data.sha,
      message: data.commit.message,
      author: data.commit.author?.name || "Unknown",
      date: data.commit.author?.date || new Date().toISOString(),
    };
  }

  async createBranch(
    options: CreateBranchOptions,
    installationId?: number
  ): Promise<{ ref: string; sha: string }> {
    // Enforce branch safety check
    assertSafeRepairBranch(options.newBranch, options.baseBranch);

    const octokit = await this.getInstallationOctokit(installationId);

    // Get the base branch SHA
    const { data: baseRef } = await octokit.rest.git.getRef({
      owner: options.owner,
      repo: options.repo,
      ref: `heads/${options.baseBranch}`,
    });

    const sha = baseRef.object.sha;

    // Create the new branch reference
    const { data: newRef } = await octokit.rest.git.createRef({
      owner: options.owner,
      repo: options.repo,
      ref: `refs/heads/${options.newBranch}`,
      sha,
    });

    return {
      ref: newRef.ref,
      sha: newRef.object.sha,
    };
  }

  async createPullRequest(
    options: CreatePullRequestOptions,
    installationId?: number
  ): Promise<PullRequestResult> {
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

  async mergePullRequest(
    owner: string,
    repo: string,
    prNumber: number,
    installationId?: number
  ): Promise<{ merged: boolean; sha: string }> {
    const octokit = await this.getInstallationOctokit(installationId);
    const { data } = await octokit.rest.pulls.merge({
      owner,
      repo,
      pull_number: prNumber,
      merge_method: "squash",
    });

    return {
      merged: data.merged,
      sha: data.sha,
    };
  }
}
