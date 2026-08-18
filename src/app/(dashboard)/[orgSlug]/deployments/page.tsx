import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DeploymentRepo, ProjectRepo } from "@/lib/supabase/repositories";
import { formatTimeAgo } from "@/lib/utils";
import { getTenantPageContext } from "@/server/tenant/context";
import { ExternalLink, GitBranch, Globe, Server } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DeploymentsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const { tenant } = await getTenantPageContext(orgSlug);
  const projects = await ProjectRepo.listByOrg(tenant.organizationId);
  const deployments = (await Promise.all(projects.map(async (project: any) => {
    const rows = await DeploymentRepo.listByProject(project.id);
    return rows.map((row: any) => ({ ...row, projectName: project.name }));
  }))).flat().sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at)));

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold tracking-tight">Deployments & Environments</h2><p className="text-xs text-muted-foreground mt-0.5">Only deployments actually observed from Vercel are recorded here.</p></div>
      <div className="space-y-3">
        {deployments.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><Server className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><h3 className="text-sm font-semibold">No deployments observed</h3><p className="text-xs text-muted-foreground mt-1">A Vercel Preview or production deployment will appear after it is observed by the release workflow.</p></CardContent></Card>
        ) : deployments.map((d: any) => (
          <Card key={d.id}><CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap"><span className="font-semibold">{d.projectName}</span><Badge variant={d.environment === "production" ? "default" : "secondary"}>{d.environment}</Badge><Badge variant={d.status === "ready" ? "success" : d.status === "error" ? "danger" : "outline"}>{d.status}</Badge><span className="text-[11px] text-muted-foreground">{formatTimeAgo(d.created_at)}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]"><span className="flex items-center gap-1"><GitBranch className="w-3 h-3 text-primary" />{d.branch || "unknown"}</span><span>Commit: {d.commit_sha?.slice(0, 12) || "unknown"}</span></div>
            </div>
            {d.url ? <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-colors"><Globe className="w-3.5 h-3.5" />Visit URL <ExternalLink className="w-3 h-3 text-muted-foreground" /></a> : null}
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
