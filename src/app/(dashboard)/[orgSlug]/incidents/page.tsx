import { IncidentCard } from "@/components/incident/incident-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InMemoryDatabase } from "@/lib/supabase/server";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import React from "react";

export default async function IncidentsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const incidents = Array.from(InMemoryDatabase.getInstance().incidents.values());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Production Incidents</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time error monitoring ingested from Sentry webhooks with automated sanitization.
          </p>
        </div>
        <Badge variant="danger">{incidents.length} Active</Badge>
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
  );
}
