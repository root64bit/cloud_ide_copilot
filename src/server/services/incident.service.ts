import { AuditLogger } from "@/lib/audit/logger";
import { NotFoundError } from "@/lib/errors";
import { IncidentRepo } from "@/lib/supabase/repositories";
import type { IncidentLevel, IncidentStatus } from "@/lib/supabase/types";
import type { NormalizedIncident } from "../providers/incident/incident.interface";
import { AuthGuard } from "../rbac/guard";

export class IncidentService {
  public static async ingestIncident(
    organizationId: string,
    projectId: string,
    incident: NormalizedIncident
  ) {
    const existing = await IncidentRepo.findByExternalIssueId(projectId, incident.externalIssueId);

    if (existing) {
      const updated = await IncidentRepo.update(organizationId, existing.id, {
        title: incident.title,
        level: incident.level as IncidentLevel,
        environment: incident.environment,
        release: incident.release || existing.release || null,
        commit_sha: incident.commitSha || existing.commit_sha || null,
        culprit: incident.culprit || existing.culprit || null,
        last_seen_at: incident.lastSeenAt,
        occurrence_count: Math.max((existing.occurrence_count || 1) + 1, incident.occurrenceCount || 1),
        sanitized_metadata: {
          stacktrace: incident.stacktrace,
          ...incident.sanitizedMetadata,
        },
      });
      return updated || existing;
    }

    let record;
    try {
      record = await IncidentRepo.create({
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
        occurrence_count: Math.max(incident.occurrenceCount || 1, 1),
        sanitized_metadata: {
          stacktrace: incident.stacktrace,
          ...incident.sanitizedMetadata,
        },
      });
    } catch (error: any) {
      // Concurrent webhook delivery can race the pre-insert lookup. The database
      // unique index remains the canonical duplicate guard.
      if (error?.code !== "23505") throw error;
      const concurrent = await IncidentRepo.findByExternalIssueId(projectId, incident.externalIssueId);
      if (!concurrent) throw error;
      record = await IncidentRepo.update(organizationId, concurrent.id, {
        last_seen_at: incident.lastSeenAt,
        occurrence_count: Math.max((concurrent.occurrence_count || 1) + 1, incident.occurrenceCount || 1),
        sanitized_metadata: {
          stacktrace: incident.stacktrace,
          ...incident.sanitizedMetadata,
        },
      }) || concurrent;
    }

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
    const incident = await IncidentRepo.findById(organizationId, incidentId);

    if (!incident) {
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
    if (projectId) {
      return IncidentRepo.listByProject(projectId);
    }
    return IncidentRepo.listByOrg(organizationId);
  }

  public static async updateStatus(
    userId: string,
    organizationId: string,
    incidentId: string,
    newStatus: IncidentStatus
  ) {
    await AuthGuard.assertPermission(userId, organizationId, "incident:resolve");
    const updated = await IncidentRepo.update(organizationId, incidentId, {
      status: newStatus,
    });

    if (!updated) {
      throw new NotFoundError("Incident", incidentId);
    }

    await AuditLogger.log({
      organizationId,
      projectId: updated.project_id,
      userId,
      eventType: "incident.status_changed",
      metadata: { to: newStatus },
    });

    return updated;
  }
}
