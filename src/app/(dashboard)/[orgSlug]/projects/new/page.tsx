"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle2, FolderGit2, Github, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";

export default function NewProjectPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = (params.orgSlug as string) || "acme-corp";

  const [repoOwner, setRepoOwner] = useState("acme-inc");
  const [repoName, setRepoName] = useState("casadepeneus");
  const [name, setName] = useState("Casa de Peneus");
  const [slug, setSlug] = useState("casadepeneus");
  const [packageManager, setPackageManager] = useState("npm");
  const [installCmd, setInstallCmd] = useState("npm ci");
  const [testCmd, setTestCmd] = useState("npm test");
  const [lintCmd, setLintCmd] = useState("npm run lint");
  const [typecheckCmd, setTypecheckCmd] = useState("npx tsc --noEmit");
  const [buildCmd, setBuildCmd] = useState("npm run build");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: "00000000-0000-0000-0000-000000000001",
          name,
          slug,
          repositoryOwner: repoOwner,
          repositoryName: repoName,
          packageManager,
          installCommand: installCmd,
          testCommand: testCmd,
          lintCommand: lintCmd,
          typecheckCommand: typecheckCmd,
          buildCommand: buildCmd,
        }),
      });

      if (res.ok) {
        router.push(`/${orgSlug}/projects/${slug}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/${orgSlug}/projects`}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
        </Link>
        <h2 className="text-xl font-bold tracking-tight">Connect Repository</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select a repository from GitHub App and configure safe sandbox execution commands.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Github className="w-4 h-4 text-foreground" /> GitHub Repository
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Repository Owner / Org"
                value={repoOwner}
                onChange={(e) => setRepoOwner(e.target.value)}
                required
              />
              <Input
                label="Repository Name"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Project Display Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="URL Slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-primary" /> Sandbox Command Configuration
              </CardTitle>
              <Badge variant="outline" className="text-[10px] gap-1 text-primary">
                <Sparkles className="w-3 h-3" /> Auto-detected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              label="Install Command"
              value={installCmd}
              onChange={(e) => setInstallCmd(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Test Command"
                value={testCmd}
                onChange={(e) => setTestCmd(e.target.value)}
                required
              />
              <Input
                label="Lint Command"
                value={lintCmd}
                onChange={(e) => setLintCmd(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Typecheck Command"
                value={typecheckCmd}
                onChange={(e) => setTypecheckCmd(e.target.value)}
                required
              />
              <Input
                label="Build Command"
                value={buildCmd}
                onChange={(e) => setBuildCmd(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Create & Connect Project
        </Button>
      </form>
    </div>
  );
}
