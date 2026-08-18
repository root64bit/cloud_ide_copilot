import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectRepo, WorkspaceRepo } from "@/lib/supabase/repositories";
import { formatTimeAgo } from "@/lib/utils";
import { getTenantPageContext } from "@/server/tenant/context";
import { ArrowRight, Box, Clock, GitBranch } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
const TERMINAL = new Set(["completed", "failed", "stopped", "expired"]);

export default async function WorkspacesListPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const { tenant } = await getTenantPageContext(orgSlug);
  const workspaces = await WorkspaceRepo.listByOrg(tenant.organizationId);
  const projects = await ProjectRepo.listByOrg(tenant.organizationId);

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold tracking-tight">Repair Workspaces</h2><p className="text-xs text-muted-foreground mt-0.5">Persisted repair sessions backed by isolated Vercel Sandbox instances.</p></div>
      <div className="space-y-3">
        {workspaces.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><Box className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><h4 className="text-sm font-medium">No repair workspaces</h4><p className="text-xs text-muted-foreground mt-1">Create one from a connected project or incident.</p></CardContent></Card>
        ) : workspaces.map((ws: any) => {
          const project = projects.find((p: any) => p.id === ws.project_id);
          return (
            <Card key={ws.id} className="hover:border-primary/40 transition-colors"><CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default" className="font-mono text-[10px]">{project?.name || "Unknown project"}</Badge>
                  <Badge variant={TERMINAL.has(ws.status) ? "secondary" : "success"}>● {ws.status}</Badge>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{formatTimeAgo(ws.last_activity_at || ws.created_at)}</span>
                </div>
                <h4 className="text-sm font-semibold">{ws.sandbox_name}</h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono"><span className="flex items-center gap-1"><GitBranch className="w-3 h-3 text-primary" />{ws.repair_branch}</span><span className="truncate max-w-[220px]">SHA: {ws.base_commit_sha?.slice(0, 12)}</span></div>
              </div>
              <Link href={`/${orgSlug}/workspaces/${ws.id}`}><Button size="sm" variant="outline" className="gap-1.5 text-xs">Open Workspace <ArrowRight className="w-3.5 h-3.5" /></Button></Link>
            </CardContent></Card>
          );
        })}
      </div>
    </div>
  );
}
