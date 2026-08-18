import { redactObject } from "../security/redaction";
import { AuditEventRepo } from "../supabase/repositories";
import type { Json } from "../supabase/types";

export interface AuditEventInput {
  organizationId: string;
  projectId?: string | null;
  workspaceId?: string | null;
  userId?: string | null;
  eventType: string;
  metadata?: Record<string, any>;
  ipHash?: string | null;
}

export class AuditLogger {
  public static async log(event: AuditEventInput): Promise<{ id: string; timestamp: string }> {
    const sanitizedMetadata = redactObject(event.metadata || {}) as Json;
    const timestamp = new Date().toISOString();

    const record = await AuditEventRepo.create({
      organization_id: event.organizationId,
      project_id: event.projectId || null,
      workspace_id: event.workspaceId || null,
      user_id: event.userId || null,
      event_type: event.eventType,
      metadata: sanitizedMetadata,
      ip_hash: event.ipHash || null,
      created_at: timestamp,
    });

    return { id: record.id, timestamp: record.created_at || timestamp };
  }

  public static async getEvents(organizationId: string, limit = 50) {
    return AuditEventRepo.listByOrg(organizationId, limit);
  }
}
