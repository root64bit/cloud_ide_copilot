import { AuditLogger } from "@/lib/audit/logger";
import { NotFoundError } from "@/lib/errors";
import { InMemoryDatabase } from "@/lib/supabase/server";
import type { IncidentLevel, IncidentStatus } from "@/lib/supabase/types";
import type { NormalizedIncident } from "../providers/incident/incident.interface";
import { AuthGuard } from "../rbac/guard";

export class IncidentService {
  public static async ingestIncident(
    organizationId: string,
    projectId: string,
    incident: NormalizedIncident
  ) {
    const incidentId = `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const record = {
      id: incidentId,
      organization_id: organizationId,
      project_id: projectId,
      provider: incident.provider,
      external_issue_id: incident.externalIssueId,
      external_event_id: incident.externalEventId || null,
      title: incident.title,
      level: incident.level as IncidentLevel,
      environment: incident.environment,
      release: incident.release || null,
      commit_sha: incident.commitSha || null,
      culprit: incident.culprit || null,
      status: "unresolved" as IncidentStatus,
      first_seen_at: incident.firstSeenAt,
      last_seen_at: incident.lastSeenAt,
      occurrence_count: incident.occurrenceCount,
      sanitized_metadata: {
        stacktrace: incident.stacktrace,
        ...incident.sanitizedMetadata,
      },
      created_at: now,
      updated_at: now,
    };

    InMemoryDatabase.getInstance().incidents.set(incidentId, record);

    await AuditLogger.log({
      organizationId,
      projectId,
      eventType: "incident.ingested",
      metadata: {
        title: incident.title,
        level: incident.level,
        externalIssueId: incident.externalIssueId,
      },
    });

    return record;
  }

  public static async getIncident(
    userId: string,
    organizationId: string,
    incidentId: string
  ) {
    await AuthGuard.assertPermission(userId, organizationId, "incident:view");
    const incident = InMemoryDatabase.getInstance().incidents.get(incidentId);

    if (!incident || incident.organization_id !== organizationId) {
      throw new NotFoundError("Incident", incidentId);
    }

    return incident;
  }

  public static async listIncidents(
    userId: string,
    organizationId: string,
    projectId?: string
  ) {
    await AuthGuard.assertPermission(userId, organizationId, "incident:view");
    const all = Array.from(InMemoryDatabase.getInstance().incidents.values());

    return all.filter((inc) => {
      if (inc.organization_id !== organizationId) return false;
      if (projectId && inc.project_id !== projectId) return false;
      return true;
    });
  }

  public static async updateStatus(
    userId: string,
    organizationId: string,
    incidentId: string,
    newStatus: IncidentStatus
  ) {
    await AuthGuard.assertPermission(userId, organizationId, "incident:resolve");
    const incident = await this.getIncident(userId, organizationId, incidentId);

    incident.status = newStatus;
    incident.updated_at = new Date().toISOString();

    await AuditLogger.log({
      organizationId,
      projectId: incident.project_id,
      userId,
      eventType: "incident.status_changed",
      metadata: { incidentId, status: newStatus },
    });

    return incident;
  }
}
