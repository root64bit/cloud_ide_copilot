import { IncidentActions } from "@/components/incident/incident-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IncidentRepo, ProjectRepo } from "@/lib/supabase/repositories";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import { getTenantPageContext } from "@/server/tenant/context";
import { AlertTriangle, ArrowLeft, Clock, Code2, Layers } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; projectSlug: string; incidentId: string }>;
}) {
  const { orgSlug, projectSlug, incidentId } = await params;
  const { tenant } = await getTenantPageContext(orgSlug);
  const project = await ProjectRepo.findBySlug(tenant.organizationId, projectSlug);
  if (!project) notFound();
  const incident = await IncidentRepo.findById(tenant.organizationId, incidentId);
  if (!incident || incident.project_id !== project.id) notFound();

  const metadata = (incident.sanitized_metadata || {}) as Record<string, unknown>;
  const stacktrace = Array.isArray(metadata.stacktrace) ? metadata.stacktrace : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/${orgSlug}/projects/${projectSlug}`} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"><ArrowLeft className="w-3.5 h-3.5" />Back to Project</Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap"><Badge variant={incident.level === "fatal" || incident.level === "error" ? "danger" : "warning"}>{incident.level}</Badge><Badge variant="outline">{incident.environment}</Badge><Badge variant="secondary">{incident.provider} {incident.external_issue_id}</Badge></div>
            <h2 className="text-lg font-bold tracking-tight mt-1 break-words">{incident.title}</h2>
            {incident.culprit ? <p className="text-xs text-muted-foreground font-mono mt-0.5 break-all">{incident.culprit}</p> : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3"><span className="text-[10px] text-muted-foreground uppercase">Occurrences</span><div className="text-lg font-bold mt-1 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-destructive" />{incident.occurrence_count}</div></Card>
        <Card className="p-3"><span className="text-[10px] text-muted-foreground uppercase">Last seen</span><div className="text-xs font-semibold mt-2 flex items-center gap-1"><Clock className="w-3 h-3" />{formatTimeAgo(incident.last_seen_at)}</div></Card>
        <Card className="p-3"><span className="text-[10px] text-muted-foreground uppercase">Release</span><div className="text-xs font-mono mt-2 truncate">{incident.release || "not supplied"}</div></Card>
        <Card className="p-3"><span className="text-[10px] text-muted-foreground uppercase">Commit</span><div className="text-xs font-mono mt-2 truncate">{incident.commit_sha?.slice(0, 12) || "not supplied"}</div></Card>
      </div>

      <IncidentActions organizationId={tenant.organizationId} projectId={project.id} incidentId={incident.id} orgSlug={orgSlug} />

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><Code2 className="w-4 h-4 text-primary" />Sanitized Sentry Evidence</CardTitle></CardHeader>
        <CardContent className="p-4 space-y-3 text-xs">
          {stacktrace.length > 0 ? (
            <div className="space-y-2">
              {stacktrace.slice(0, 20).map((frame: any, index: number) => (
                <div key={index} className="p-2.5 rounded bg-secondary/30 border border-border/50 font-mono text-[11px]"><span className="text-primary">{String(frame.filename || "unknown")}{frame.lineno ? `:${frame.lineno}` : ""}</span><span className="text-muted-foreground ml-2">{String(frame.function || "")}</span></div>
              ))}
            </div>
          ) : <p className="text-muted-foreground">No sanitized stack frames were persisted for this incident.</p>}
          <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground">First seen {formatDate(incident.first_seen_at)} · Last seen {formatDate(incident.last_seen_at)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
