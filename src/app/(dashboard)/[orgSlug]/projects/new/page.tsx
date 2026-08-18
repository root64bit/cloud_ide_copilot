"use client";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FolderGit2, Github, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";

type GithubRepo = {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

export default function NewProjectPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [installationId, setInstallationId] = useState<number | null>(null);
  const [repositories, setRepositories] = useState<GithubRepo[]>([]);
  const [selectedFullName, setSelectedFullName] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [installCmd, setInstallCmd] = useState("npm ci");
  const [testCmd, setTestCmd] = useState("npm test");
  const [lintCmd, setLintCmd] = useState("npm run lint");
  const [typecheckCmd, setTypecheckCmd] = useState("npx tsc --noEmit");
  const [buildCmd, setBuildCmd] = useState("npm run build");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedRepo = useMemo(
    () => repositories.find((repository) => repository.fullName === selectedFullName) || null,
    [repositories, selectedFullName]
  );

  const loadConnection = useCallback(async () => {
    setLoadingRepos(true);
    setError(null);
    try {
      const orgRes = await fetch(`/api/organizations?slug=${encodeURIComponent(orgSlug)}`, { cache: "no-store" });
      const orgData = await orgRes.json();
      if (!orgRes.ok) throw new Error(orgData?.error || "Unable to resolve organization");
      setOrganizationId(orgData.organization.id);

      const repoRes = await fetch("/api/integrations/github/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const repoData = await repoRes.json();
      if (!repoRes.ok) throw new Error(repoData?.error || "GitHub installation session is not available");
      setInstallationId(repoData.installationId);
      setRepositories(repoData.repositories || []);
      if (repoData.repositories?.length) {
        const repository = repoData.repositories[0] as GithubRepo;
        setSelectedFullName(repository.fullName);
        setName(repository.name);
        setSlug(slugify(repository.name));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load GitHub repositories");
    } finally {
      setLoadingRepos(false);
    }
  }, [orgSlug]);

  useEffect(() => {
    void loadConnection();
  }, [loadConnection]);

  const handleRepositoryChange = (fullName: string) => {
    setSelectedFullName(fullName);
    const repository = repositories.find((item) => item.fullName === fullName);
    if (repository) {
      setName(repository.name);
      setSlug(slugify(repository.name));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organizationId || !installationId || !selectedRepo) {
      setError("A verified GitHub App installation and repository selection are required.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          name,
          slug,
          repositoryOwner: selectedRepo.owner,
          repositoryName: selectedRepo.name,
          packageManager: installCmd.startsWith("pnpm") ? "pnpm" : installCmd.startsWith("yarn") ? "yarn" : "npm",
          installCommand: installCmd,
          testCommand: testCmd,
          lintCommand: lintCmd,
          typecheckCommand: typecheckCmd,
          buildCommand: buildCmd,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to connect project");
      router.push(`/${orgSlug}/projects/${data.project.slug}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to connect project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href={`/${orgSlug}/projects`} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"><ArrowLeft className="w-3.5 h-3.5" />Back to Projects</Link>
        <h2 className="text-xl font-bold tracking-tight">Connect Repository</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Choose only repositories actually exposed by your GitHub App installation.</p>
      </div>

      {error ? <Alert variant="warning" title="GitHub connection required">{error}. If you just installed or updated the GitHub App, return through its Setup URL and reload this page.</Alert> : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-sm font-bold flex items-center gap-2"><Github className="w-4 h-4" />GitHub Repository</CardTitle><Button type="button" size="sm" variant="outline" onClick={loadConnection} disabled={loadingRepos} className="gap-1"><RefreshCcw className="w-3 h-3" />Refresh</Button></div></CardHeader>
          <CardContent className="space-y-3">
            <label className="space-y-1 block"><span className="text-xs font-medium">Repository</span><select value={selectedFullName} onChange={(e) => handleRepositoryChange(e.target.value)} disabled={loadingRepos || repositories.length === 0} className="w-full h-9 rounded-md border border-input bg-card px-3 text-sm"><option value="">{loadingRepos ? "Loading..." : "Select repository"}</option>{repositories.map((repository) => <option key={repository.id} value={repository.fullName}>{repository.fullName}{repository.isPrivate ? " (private)" : ""}</option>)}</select></label>
            {selectedRepo ? <div className="flex gap-2"><Badge variant="outline">Default: {selectedRepo.defaultBranch}</Badge><Badge variant="secondary">Repository ID {selectedRepo.id}</Badge></div> : null}
            <div className="grid grid-cols-2 gap-3"><Input label="Project Display Name" value={name} onChange={(e) => setName(e.target.value)} required /><Input label="URL Slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} required /></div>
          </CardContent>
        </Card>

        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><FolderGit2 className="w-4 h-4 text-primary" />Sandbox Command Configuration</CardTitle></CardHeader><CardContent className="space-y-3"><Input label="Install Command" value={installCmd} onChange={(e) => setInstallCmd(e.target.value)} required /><div className="grid grid-cols-2 gap-3"><Input label="Test Command" value={testCmd} onChange={(e) => setTestCmd(e.target.value)} /><Input label="Lint Command" value={lintCmd} onChange={(e) => setLintCmd(e.target.value)} /></div><div className="grid grid-cols-2 gap-3"><Input label="Typecheck Command" value={typecheckCmd} onChange={(e) => setTypecheckCmd(e.target.value)} /><Input label="Build Command" value={buildCmd} onChange={(e) => setBuildCmd(e.target.value)} required /></div></CardContent></Card>
        <Button type="submit" isLoading={isLoading} disabled={!selectedRepo || !installationId || !organizationId} className="w-full">Create & Connect Project</Button>
      </form>
    </div>
  );
}
