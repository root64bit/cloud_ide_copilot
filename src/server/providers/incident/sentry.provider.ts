import { redactObject } from "@/lib/security/redaction";
import { verifySentrySignature } from "@/lib/security/signature";
import type { IncidentLevel } from "@/lib/supabase/types";
import type { IncidentProvider, NormalizedIncident } from "./incident.interface";

export class SentryIncidentProvider implements IncidentProvider {
  private secret: string;

  constructor() {
    this.secret = process.env.SENTRY_WEBHOOK_SECRET || "mock-sentry-secret";
  }

  verifyWebhook(rawPayload: string | Buffer, signatureHeader: string | null): boolean {
    return verifySentrySignature(rawPayload, signatureHeader, this.secret);
  }

  normalizeWebhook(payload: Record<string, any>): NormalizedIncident {
    // Sentry webhook formats can come as issue alert or event alert
    const data = payload.data || payload;
    const issue = data.issue || data;
    const event = data.event || {};

    const externalIssueId = String(issue.id || event.issue_id || `sentry_${Date.now()}`);
    const externalEventId = event.event_id || event.id || undefined;
    const title = issue.title || event.title || event.message || "Unknown Sentry Error";

    let level: IncidentLevel = "error";
    const rawLevel = (issue.level || event.level || "error").toLowerCase();
    if (["fatal", "error", "warning", "info"].includes(rawLevel)) {
      level = rawLevel as IncidentLevel;
    }

    const environment = event.environment || issue.environment || "production";
    const release = event.release || issue.release?.version || undefined;
    const culprit = issue.culprit || event.culprit || undefined;

    // Extract Git commit SHA if present in release metadata
    let commitSha: string | undefined = undefined;
    if (event.release && typeof event.release === "string" && event.release.includes("@")) {
      commitSha = event.release.split("@")[1];
    } else if (release && /^[a-f0-9]{40}$/i.test(release)) {
      commitSha = release;
    }

    // Extract and sanitize stacktrace
    const rawFrames =
      event.exception?.values?.[0]?.stacktrace?.frames ||
      event.threads?.values?.[0]?.stacktrace?.frames ||
      [];

    const stacktrace = rawFrames.map((frame: any) => ({
      filename: frame.filename || frame.module || "unknown",
      lineno: frame.lineno || 0,
      function: frame.function || "?",
      contextLine: frame.context_line ? redactObject(frame.context_line) : undefined,
    }));

    // Sanitize any metadata (stripping cookies, auth headers, tokens, personal data)
    const sanitizedMetadata = redactObject({
      tags: event.tags || issue.tags || {},
      user: event.user ? { id: event.user.id } : undefined, // Strip IP, email, username
      request: event.request
        ? {
            url: event.request.url,
            method: event.request.method,
            query_string: redactObject(event.request.query_string),
          }
        : undefined,
      platform: event.platform || "javascript",
      culprit,
      logger: event.logger,
    });

    return {
      provider: "sentry",
      externalIssueId,
      externalEventId,
      title,
      level,
      environment,
      release,
      commitSha,
      culprit,
      firstSeenAt: issue.firstSeen || new Date().toISOString(),
      lastSeenAt: issue.lastSeen || new Date().toISOString(),
      occurrenceCount: Number(issue.count || 1),
      stacktrace,
      sanitizedMetadata,
    };
  }
}
