import { IncidentCard } from "@/components/incident/incident-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InMemoryDatabase } from "@/lib/supabase/server";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Box,
  CheckCircle2,
  FolderGit2,
  GitBranch,
  Plus,
  Server,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import React from "react";

export default async function DashboardOverviewPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const db = InMemoryDatabase.getInstance();

  const projects = Array.from(db.projects.values());
  const incidents = Array.from(db.incidents.values()).filter((i) => i.status !== "resolved");
  const workspaces = Array.from(db.workspaces.values());
  const deployments = Array.from(db.deployments.values());

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
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Active Projects</h3>
          <Link
            href={`/${orgSlug}/projects`}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View all projects <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <Card key={proj.id} className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-foreground">
                      {proj.name}
                    </CardTitle>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {proj.repository_owner}/{proj.repository_name}
                    </Badge>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    ● Ready
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3 text-xs">
                <p className="text-muted-foreground line-clamp-2">{proj.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Server className="w-3 h-3" /> {proj.deployment_provider}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <GitBranch className="w-3 h-3" /> {proj.default_branch}
                  </span>
                  <Link
                    href={`/${orgSlug}/projects/${proj.slug}`}
                    className="text-primary hover:underline font-semibold"
                  >
                    Open Console →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sentry Production Incidents */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Production Incidents</h3>
            <Badge variant="danger" className="text-[10px]">
              {incidents.length} Unresolved
            </Badge>
          </div>
          <Link
            href={`/${orgSlug}/incidents`}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            All Incidents <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-3">
          {incidents.map((inc) => (
            <IncidentCard
              key={inc.id}
              orgSlug={orgSlug}
              projectSlug="onedealer"
              incident={inc}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
