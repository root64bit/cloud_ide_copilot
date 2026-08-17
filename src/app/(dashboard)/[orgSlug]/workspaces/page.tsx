import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrganizationRepo, ProjectRepo, WorkspaceRepo } from "@/lib/supabase/repositories";
import { formatTimeAgo } from "@/lib/utils";
import { ArrowRight, Box, Clock, GitBranch } from "lucide-react";
import Link from "next/link";
import React from "react";

export const dynamic = "force-dynamic";

export default async function WorkspacesListPage({
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

  const workspaces = await WorkspaceRepo.listByOrg(org.id);
  const projects = await ProjectRepo.listByOrg(org.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Repair Workspaces</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Isolated execution sandboxes running @vercel/sandbox with automated validation gates.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {workspaces.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Box className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <h4 className="text-sm font-medium text-foreground">No Active Workspaces</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Trigger a repair from an incident or project to launch an isolated sandbox.
              </p>
            </CardContent>
          </Card>
        ) : (
          workspaces.map((ws) => {
            const project = projects.find((p) => p.id === ws.project_id);
            return (
              <Card key={ws.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="default" className="font-mono text-[10px]">
                        {project?.name || "Project"}
                      </Badge>
                      <Badge variant={ws.status === "ready" || ws.status === "preview_ready" ? "success" : "secondary"}>
                        ● {ws.status}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatTimeAgo(ws.last_activity_at || ws.created_at)}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-foreground">{ws.sandbox_name}</h4>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3 text-primary" /> {ws.repair_branch}
                      </span>
                      <span className="truncate max-w-[200px]">SHA: {ws.base_commit_sha?.slice(0, 7)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link href={`/${orgSlug}/workspaces/${ws.id}`}>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                        Open Workspace
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
