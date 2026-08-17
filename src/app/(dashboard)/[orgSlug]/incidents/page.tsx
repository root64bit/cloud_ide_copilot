import { IncidentCard } from "@/components/incident/incident-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IncidentRepo, OrganizationRepo, ProjectRepo } from "@/lib/supabase/repositories";
import { CheckCircle2 } from "lucide-react";
import React from "react";

export const dynamic = "force-dynamic";

export default async function IncidentsPage({
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

  const incidents = await IncidentRepo.listByOrg(org.id);
  const projects = await ProjectRepo.listByOrg(org.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Production Incidents</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time error monitoring ingested from Sentry webhooks with automated sanitization.
          </p>
        </div>
        <Badge variant={incidents.length > 0 ? "danger" : "default"}>{incidents.length} Total</Badge>
      </div>

      <div className="space-y-3">
        {incidents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-sm font-medium text-foreground">Zero Incidents</h4>
              <p className="text-xs text-muted-foreground mt-1">
                No production errors reported by Sentry for this organization.
              </p>
            </CardContent>
          </Card>
        ) : (
          incidents.map((inc: any) => {
            const project = projects.find((p: any) => p.id === inc.project_id);
            return (
              <IncidentCard
                key={inc.id}
                orgSlug={orgSlug}
                projectSlug={project?.slug || "project"}
                incident={inc as any}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
