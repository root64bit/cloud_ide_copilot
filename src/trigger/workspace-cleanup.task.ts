import { task } from "@trigger.dev/sdk";

/**
 * Reserved cleanup scheduler.
 *
 * Real workspace persistence and sandbox stop operations exist, but an
 * authenticated machine-actor policy for scheduled cleanup has not yet been
 * defined. Failing closed prevents silent leaked-sandbox claims.
 */
export const workspaceCleanupTask = task({
  id: "workspace-cleanup",
  run: async () => {
    throw new Error(
      "WORKSPACE_CLEANUP_MACHINE_ACTOR_NOT_CONFIGURED: define the scheduled cleanup actor/authorization policy before enabling this task."
    );
  },
});
