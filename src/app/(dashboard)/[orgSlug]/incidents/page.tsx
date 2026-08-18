import { IncidentCard } from "@/components/incident/incident-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IncidentRepo, ProjectRepo } from "@/lib/supabase/repositories";
import { getTenantPageContext } from "@/server/tenant/context";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function IncidentsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const { tenant } = await getTenantPageContext(orgSlug);
  const incidents = await IncidentRepo.listByOrg(tenant.organizationId);
  const projects = await ProjectRepo.listByOrg(tenant.organizationId);
  const openCount = incidents.filter((incident: any) => incident.status !== "resolved").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div><h2 className="text-xl font-bold tracking-tight">Production Incidents</h2><p className="text-xs text-muted-foreground mt-0.5">Sanitized incidents mapped only to explicitly connected Sentry projects.</p></div>
        <Badge variant={openCount > 0 ? "danger" : "default"}>{openCount} Open</Badge>
      </div>
      <div className="space-y-3">
        {incidents.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" /><h4 className="text-sm font-medium">No incidents recorded</h4><p className="text-xs text-muted-foreground mt-1">Connect Sentry to start receiving signed incident events.</p></CardContent></Card>
        ) : incidents.map((inc: any) => {
          const project = projects.find((p: any) => p.id === inc.project_id);
          if (!project) return null;
          return <IncidentCard key={inc.id} orgSlug={orgSlug} projectSlug={project.slug} incident={inc} />;
        })}
      </div>
    </div>
  );
}
