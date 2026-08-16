import { redactObject } from "../security/redaction";
import { InMemoryDatabase } from "../supabase/server";
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
  /**
   * Logs a structured audit event into the database.
   * All metadata is automatically passed through the secret redaction engine.
   */
  public static async log(event: AuditEventInput): Promise<{ id: string; timestamp: string }> {
    const sanitizedMetadata = redactObject(event.metadata || {}) as Json;
    const timestamp = new Date().toISOString();
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const record = {
      id,
      organization_id: event.organizationId,
      project_id: event.projectId || null,
      workspace_id: event.workspaceId || null,
      user_id: event.userId || null,
      event_type: event.eventType,
      metadata: sanitizedMetadata,
      ip_hash: event.ipHash || null,
      created_at: timestamp,
    };

    // Store in in-memory instance (or Supabase in production)
    InMemoryDatabase.getInstance().auditEvents.unshift(record);

    return { id, timestamp };
  }

  /**
   * Retrieves audit events scoped to a specific organization.
   */
  public static async getEvents(organizationId: string, limit = 50) {
    const events = InMemoryDatabase.getInstance().auditEvents.filter(
      (e) => e.organization_id === organizationId
    );
    return events.slice(0, limit);
  }
}
