import { IncidentCard } from "@/components/incident/incident-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InMemoryDatabase } from "@/lib/supabase/server";
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  CheckCircle2,
  Code2,
  ExternalLink,
  GitBranch,
  Github,
  Play,
  Server,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; projectSlug: string }>;
}) {
  const { orgSlug, projectSlug } = await params;
  const db = InMemoryDatabase.getInstance();

  const allProjects = Array.from(db.projects.values());
  const project = allProjects.find((p) => p.slug === projectSlug);

  if (!project) {
    notFound();
  }

  const incidents = Array.from(db.incidents.values()).filter(
    (i) => i.project_id === project.id && i.status !== "resolved"
  );
  const workspaces = Array.from(db.workspaces.values()).filter(
    (w) => w.project_id === project.id
  );
  const deployments = Array.from(db.deployments.values()).filter(
    (d) => d.project_id === project.id
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${orgSlug}/projects`}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">{project.name}</h2>
              <Badge variant="success">Production Live</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/${orgSlug}/workspaces`}>
              <Button size="sm" className="gap-1.5">
                <Box className="w-3.5 h-3.5" />
                Launch Sandbox Workspace
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Meta Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-3 bg-secondary/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5 text-foreground" /> Repository
            </span>
            <a
              href={`https://github.com/${project.repository_owner}/${project.repository_name}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-mono text-[11px] flex items-center gap-1"
            >
              {project.repository_owner}/{project.repository_name} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </Card>

        <Card className="p-3 bg-secondary/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-foreground" /> Domain
            </span>
            <a
              href={`https://${project.production_domain}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-mono text-[11px] flex items-center gap-1"
            >
              {project.production_domain || `${project.slug}.example.com`} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </Card>

        <Card className="p-3 bg-secondary/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-foreground" /> Default Branch
            </span>
            <span className="font-mono text-[11px] text-foreground font-semibold">
              {project.default_branch}
            </span>
          </div>
        </Card>
      </div>

      {/* Active Incidents */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" /> Active Sentry Incidents
          </h3>
          <Badge variant="danger">{incidents.length} open</Badge>
        </div>

        {incidents.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-xs text-muted-foreground">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
              No open incidents for this project.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {incidents.map((inc) => (
              <IncidentCard
                key={inc.id}
                orgSlug={orgSlug}
                projectSlug={project.slug}
                incident={inc}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sandboxes & Workspaces */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Box className="w-4 h-4 text-emerald-400" /> Active Repair Sandboxes
        </h3>

        {workspaces.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-xs text-muted-foreground">
              No active sandbox workspaces currently open.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {workspaces.map((ws) => (
              <Card key={ws.id}>
                <CardContent className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <span>{ws.sandbox_name}</span>
                      <Badge variant="secondary">{ws.status}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      Branch: {ws.repair_branch} | Base: {ws.base_commit_sha.slice(0, 7)}
                    </p>
                  </div>
                  <Link href={`/${orgSlug}/workspaces/${ws.id}`}>
                    <Button size="sm" variant="outline">
                      Open Workspace
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
