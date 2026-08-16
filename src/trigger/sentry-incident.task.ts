/**
 * Trigger.dev Long-Running Task: Process Sentry Incident
 * Dispatched immediately from /api/webhooks/sentry so the webhook responds in milliseconds.
 */

export interface ProcessSentryIncidentPayload {
  organizationId: string;
  projectId: string;
  incidentId: string;
  autoDiagnose?: boolean;
}

export const processSentryIncidentTask = {
  id: "process-sentry-incident",
  name: "Process Ingested Sentry Incident",
  run: async (payload: ProcessSentryIncidentPayload) => {
    console.log(`[Trigger.dev] Processing Sentry incident: ${payload.incidentId}`);
    // In background worker:
    // 1. Fetch incident details
    // 2. If autoDiagnose is true, run AI analysis
    // 3. Notify subscribers or create ready-state alert
    return {
      success: true,
      incidentId: payload.incidentId,
      processedAt: new Date().toISOString(),
    };
  },
};
