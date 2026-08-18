import { assertSafeRepairBranch } from "@/lib/security/branch-guard";
import type {
  CreateBranchOptions,
  CreatePullRequestOptions,
  GitCommit,
  GitProvider,
  GitRepository,
  PullRequestResult,
} from "./git.interface";

export class MockGitProvider implements GitProvider {
  private branches = new Map<string, string>();
  private prCounter = 100;

  async listRepositories(_installationId: number): Promise<GitRepository[]> {
    return [
      {
        id: 84920192,
        owner: "acme-inc",
        name: "onedealer",
        fullName: "acme-inc/onedealer",
        defaultBranch: "main",
        isPrivate: true,
        htmlUrl: "https://github.com/acme-inc/onedealer",
        cloneUrl: "https://github.com/acme-inc/onedealer.git",
      },
      {
        id: 84920193,
        owner: "acme-inc",
        name: "yaka",
        fullName: "acme-inc/yaka",
        defaultBranch: "main",
        isPrivate: true,
        htmlUrl: "https://github.com/acme-inc/yaka",
        cloneUrl: "https://github.com/acme-inc/yaka.git",
      },
    ];
  }

  async getRepository(owner: string, repo: string): Promise<GitRepository> {
    return {
      id: 84920192,
      owner,
      name: repo,
      fullName: `${owner}/${repo}`,
      defaultBranch: "main",
      isPrivate: true,
      htmlUrl: `https://github.com/${owner}/${repo}`,
      cloneUrl: `https://github.com/${owner}/${repo}.git`,
    };
  }

  async getLatestCommit(owner: string, repo: string, branch = "main"): Promise<GitCommit> {
    return {
      sha: "a9f82d1c5e4b7890123456789abcdef012345678",
      message: "fix(checkout): adjust coupon discount validation logic",
      author: "Senior Architect",
      date: new Date().toISOString(),
    };
  }

  async getInstallationAccessToken(_installationId: number): Promise<string> {
    return "mock-installation-token";
  }

  async createBranch(options: CreateBranchOptions): Promise<{ ref: string; sha: string }> {
    assertSafeRepairBranch(options.newBranch, options.baseBranch);
    const sha = "a9f82d1c5e4b7890123456789abcdef012345678";
    this.branches.set(options.newBranch, sha);
    return {
      ref: `refs/heads/${options.newBranch}`,
      sha,
    };
  }

  async createPullRequest(options: CreatePullRequestOptions): Promise<PullRequestResult> {
    assertSafeRepairBranch(options.headBranch, options.baseBranch);
    this.prCounter += 1;
    return {
      number: this.prCounter,
      id: this.prCounter * 1000,
      url: `https://api.github.com/repos/${options.owner}/${options.repo}/pulls/${this.prCounter}`,
      htmlUrl: `https://github.com/${options.owner}/${options.repo}/pull/${this.prCounter}`,
      state: "open",
    };
  }

  async mergePullRequest(_owner: string, _repo: string, _prNumber: number): Promise<{ merged: boolean; sha: string }> {
    return {
      merged: true,
      sha: "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    };
  }
}
