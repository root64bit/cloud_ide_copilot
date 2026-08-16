import { task } from "@trigger.dev/sdk";

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

export const processSentryIncidentTask = task({
  id: "process-sentry-incident",
  run: async (payload: ProcessSentryIncidentPayload) => {
    console.log(`[Trigger.dev] Processing Sentry incident: ${payload.incidentId}`);
    return {
      success: true,
      incidentId: payload.incidentId,
      processedAt: new Date().toISOString(),
    };
  },
});
