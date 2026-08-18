import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectRepo } from "@/lib/supabase/repositories";
import { getTenantPageContext } from "@/server/tenant/context";
import { ArrowRight, FolderGit2, Plus, Server } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectsListPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const { tenant } = await getTenantPageContext(orgSlug);
  const projects = await ProjectRepo.listByOrg(tenant.organizationId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Connected Projects</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Repositories explicitly connected through your GitHub App installation.
          </p>
        </div>
        <Link href={`/${orgSlug}/projects/new`}>
          <Button size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" />Connect New Project</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card><CardContent className="p-10 text-center">
          <FolderGit2 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-sm font-semibold">No repositories connected</h3>
          <p className="text-xs text-muted-foreground mt-1">Install/connect the GitHub App, then select a repository.</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj: any) => (
            <Card key={proj.id} className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-bold truncate">{proj.name}</CardTitle>
                    <p className="font-mono text-[10px] text-muted-foreground truncate mt-1">{proj.repository_owner}/{proj.repository_name}</p>
                  </div>
                  <Badge variant={proj.status === "active" ? "success" : "outline"}>{proj.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4 text-xs">
                {proj.description ? <p className="text-muted-foreground">{proj.description}</p> : null}
                <div className="bg-secondary/40 p-2.5 rounded-md border border-border/50 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between gap-3 text-muted-foreground"><span>Install:</span><span className="text-foreground truncate">{proj.install_command}</span></div>
                  <div className="flex justify-between gap-3 text-muted-foreground"><span>Test:</span><span className="text-foreground truncate">{proj.test_command || "not configured"}</span></div>
                  <div className="flex justify-between gap-3 text-muted-foreground"><span>Build:</span><span className="text-foreground truncate">{proj.build_command}</span></div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Server className="w-3 h-3" />{proj.vercel_project_id ? "Vercel connected" : "Vercel not connected"}</span>
                  <Link href={`/${orgSlug}/projects/${proj.slug}`} className="inline-flex items-center gap-1 text-primary hover:underline font-semibold">Manage Console <ArrowRight className="w-3.5 h-3.5" /></Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
