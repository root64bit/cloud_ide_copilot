import { task } from "@trigger.dev/sdk";

/**
 * Reserved automatic incident-processing boundary.
 *
 * Sentry incidents are persisted in Supabase, but automatic background AI
 * diagnosis is intentionally disabled until an explicit organization policy and
 * machine-actor authorization model are implemented.
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
      `SENTRY_AUTO_DIAGNOSE_NOT_ENABLED: incident ${payload.incidentId} requires explicit operator action under the current release policy.`
    );
  },
});
