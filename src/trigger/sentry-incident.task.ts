import { task } from "@trigger.dev/sdk";

/**
 * Placeholder orchestration boundary only. Sentry ingestion currently uses in-memory
 * application state, which cannot be safely shared with Trigger.dev workers. Failing is
 * safer than claiming an incident was processed when it was not.
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
    throw new Error(
      `SENTRY_TASK_NOT_WIRED: incident ${payload.incidentId} must be persisted in Supabase before Trigger.dev processing is enabled.`
    );
  },
});
