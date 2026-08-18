import { IncidentCard } from "@/components/incident/incident-card";
import { LaunchWorkspaceButton } from "@/components/project/launch-workspace-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeploymentRepo, IncidentRepo, ProjectRepo, WorkspaceRepo } from "@/lib/supabase/repositories";
import { getTenantPageContext } from "@/server/tenant/context";
import { AlertTriangle, ArrowLeft, Box, CheckCircle2, ExternalLink, GitBranch, Github, Server } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ orgSlug: string; projectSlug: string }> }) {
  const { orgSlug, projectSlug } = await params;
  const { tenant } = await getTenantPageContext(orgSlug);
  const project = await ProjectRepo.findBySlug(tenant.organizationId, projectSlug);
  if (!project) notFound();
  const incidents = (await IncidentRepo.listByProject(project.id)).filter((incident: any) => incident.status !== "resolved");
  const workspaces = await WorkspaceRepo.listByProject(project.id);
  const deployments = await DeploymentRepo.listByProject(project.id);
  const latestProduction = deployments.find((deployment: any) => deployment.environment === "production");

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/${orgSlug}/projects`} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"><ArrowLeft className="w-3.5 h-3.5" />Back to Projects</Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div><div className="flex items-center gap-2"><h2 className="text-xl font-bold tracking-tight">{project.name}</h2><Badge variant={project.status === "active" ? "success" : "outline"}>{project.status}</Badge></div>{project.description ? <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p> : null}</div>
          <LaunchWorkspaceButton organizationId={tenant.organizationId} projectId={project.id} orgSlug={orgSlug} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-3 bg-secondary/30"><div className="flex items-center justify-between gap-3 text-xs"><span className="text-muted-foreground flex items-center gap-1.5"><Github className="w-3.5 h-3.5" />Repository</span><a href={`https://github.com/${project.repository_owner}/${project.repository_name}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono text-[11px] flex items-center gap-1 truncate">{project.repository_owner}/{project.repository_name}<ExternalLink className="w-3 h-3 shrink-0" /></a></div></Card>
        <Card className="p-3 bg-secondary/30"><div className="flex items-center justify-between gap-3 text-xs"><span className="text-muted-foreground flex items-center gap-1.5"><Server className="w-3.5 h-3.5" />Production</span>{latestProduction?.url || project.production_domain ? <a href={latestProduction?.url || `https://${project.production_domain}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono text-[11px] flex items-center gap-1 truncate">{latestProduction?.status || "configured"}<ExternalLink className="w-3 h-3" /></a> : <span className="text-[11px] text-muted-foreground">not observed</span>}</div></Card>
        <Card className="p-3 bg-secondary/30"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5" />Default Branch</span><span className="font-mono text-[11px] font-semibold">{project.default_branch}</span></div></Card>
      </div>

      <div className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" />Active Sentry Incidents</h3><Badge variant={incidents.length ? "danger" : "secondary"}>{incidents.length} open</Badge></div>{incidents.length === 0 ? <Card><CardContent className="p-6 text-center text-xs text-muted-foreground"><CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />No open incidents for this project.</CardContent></Card> : <div className="space-y-3">{incidents.map((incident: any) => <IncidentCard key={incident.id} orgSlug={orgSlug} projectSlug={project.slug} incident={incident} />)}</div>}</div>

      <div className="space-y-3"><h3 className="text-sm font-semibold flex items-center gap-2"><Box className="w-4 h-4 text-emerald-400" />Repair Workspaces</h3>{workspaces.length === 0 ? <Card><CardContent className="p-6 text-center text-xs text-muted-foreground">No repair workspaces have been created for this project.</CardContent></Card> : <div className="space-y-2">{workspaces.slice(0, 10).map((workspace: any) => <Card key={workspace.id}><CardContent className="p-4 flex items-center justify-between gap-4 text-xs"><div className="min-w-0"><div className="font-semibold flex items-center gap-2"><span className="truncate">{workspace.sandbox_name}</span><Badge variant="secondary">{workspace.status}</Badge></div><p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">{workspace.repair_branch} · {workspace.base_commit_sha.slice(0, 12)}</p></div><Link href={`/${orgSlug}/workspaces/${workspace.id}`}><Button size="sm" variant="outline">Open Workspace</Button></Link></CardContent></Card>)}</div>}</div>
    </div>
  );
}
