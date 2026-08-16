import type { IncidentLevel } from "@/lib/supabase/types";

export interface NormalizedIncident {
  provider: "sentry" | "generic";
  externalIssueId: string;
  externalEventId?: string;
  title: string;
  level: IncidentLevel;
  environment: string;
  release?: string;
  commitSha?: string;
  culprit?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  occurrenceCount: number;
  stacktrace: Array<{
    filename: string;
    lineno: number;
    function: string;
    contextLine?: string;
  }>;
  sanitizedMetadata: Record<string, any>;
}

export interface IncidentProvider {
  verifyWebhook(rawPayload: string | Buffer, signatureHeader: string | null): boolean;
  normalizeWebhook(payload: Record<string, any>): NormalizedIncident;
}
