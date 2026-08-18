export interface GitRepository {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
  htmlUrl: string;
  cloneUrl: string;
}

export interface GitCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface CreateBranchOptions {
  owner: string;
  repo: string;
  baseBranch: string;
  newBranch: string;
}

export interface CreatePullRequestOptions {
  owner: string;
  repo: string;
  title: string;
  body: string;
  headBranch: string;
  baseBranch: string;
}

export interface PullRequestResult {
  number: number;
  id: number;
  url: string;
  htmlUrl: string;
  state: "open" | "closed";
}

export interface GitProvider {
  listRepositories(installationId: number): Promise<GitRepository[]>;
  getRepository(owner: string, repo: string, installationId?: number): Promise<GitRepository>;
  getLatestCommit(owner: string, repo: string, branch?: string, installationId?: number): Promise<GitCommit>;
  getInstallationAccessToken?(installationId: number): Promise<string>;
  createBranch(options: CreateBranchOptions, installationId?: number): Promise<{ ref: string; sha: string }>;
  createPullRequest(options: CreatePullRequestOptions, installationId?: number): Promise<PullRequestResult>;
  mergePullRequest(owner: string, repo: string, prNumber: number, installationId?: number): Promise<{ merged: boolean; sha: string }>;
}
