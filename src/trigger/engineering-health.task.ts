import { logger, task } from "@trigger.dev/sdk";

export const engineeringHealthCheckTask = task({
  id: "engineering-health-check",
  maxDuration: 60,
  run: async (payload: { source?: string; nonce?: string }) => {
    const executedAt = new Date().toISOString();
    logger.info("Real Trigger.dev worker executed", {
      source: payload.source || "unknown",
      nonce: payload.nonce || null,
      executedAt,
    });

    return {
      ok: true,
      provider: "trigger.dev",
      executedAt,
      source: payload.source || "unknown",
      nonce: payload.nonce || null,
    };
  },
});
