import { IncidentCard } from "@/components/incident/incident-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IncidentRepo,
  OrganizationRepo,
  ProjectRepo,
  WorkspaceRepo,
} from "@/lib/supabase/repositories";
import {
  AlertTriangle,
  ArrowUpRight,
  Box,
  CheckCircle2,
  FolderGit2,
  GitBranch,
  Plus,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import React from "react";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = (await OrganizationRepo.findBySlug(orgSlug)) || {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Acme Engineering",
    slug: orgSlug,
  };

  const projects = await ProjectRepo.listByOrg(org.id);
  const allIncidents = await IncidentRepo.listByOrg(org.id);
  const incidents = allIncidents.filter((i: any) => i.status !== "resolved");
  const workspaces = await WorkspaceRepo.listByOrg(org.id);

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Engineering Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Production monitoring, isolated repair sandboxes, and automated validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/${orgSlug}/projects/new`}>
            <Button size="sm" className="gap-1.5 shadow-xs">
              <Plus className="w-3.5 h-3.5" />
              Connect Repository
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Connected Projects</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{projects.length}</h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Open Incidents (Sentry)</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{incidents.length}</h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Active Workspaces</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{workspaces.length}</h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Box className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Production Status</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-emerald-400">Protected</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Active Incidents Requiring Attention */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Active Incidents Requiring Investigation
            </h3>
            <Link
              href={`/${orgSlug}/incidents`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              View all ({incidents.length})
            </Link>
          </div>

          <div className="space-y-3">
            {incidents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <h4 className="text-sm font-medium text-foreground">Zero Active Incidents</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    No production errors reported by Sentry.
                  </p>
                </CardContent>
              </Card>
            ) : (
              incidents.slice(0, 5).map((incident: any) => {
                const project = projects.find((p: any) => p.id === incident.project_id);
                return (
                  <IncidentCard
                    key={incident.id}
                    incident={incident as any}
                    projectSlug={project?.slug || "project"}
                    orgSlug={orgSlug}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (1 col): Connected Projects & Pipeline Status */}
        <div className="space-y-6">
          {/* Projects Quick List */}
          <Card>
            <CardHeader className="p-4 pb-2 border-b border-border/60">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Projects</span>
                <Link
                  href={`/${orgSlug}/projects`}
                  className="text-primary hover:underline lowercase font-normal"
                >
                  view all
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 divide-y divide-border/40">
              {projects.map((proj: any) => (
                <div key={proj.id} className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between">
                  <div>
                    <Link
                      href={`/${orgSlug}/projects/${proj.slug}`}
                      className="text-xs font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      {proj.name}
                      <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                    </Link>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                      <GitBranch className="w-3 h-3" />
                      {proj.repository_owner}/{proj.repository_name}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {proj.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Safety Gate Guarantee Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Human-in-the-Loop Release Gate
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI coding agents operate in isolated sandboxes. Pull requests and production merges strictly require human confirmation from an authorized engineer or admin.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
