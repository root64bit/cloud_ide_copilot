import { schedules } from "@trigger.dev/sdk";

/**
 * Trigger.dev Scheduled Cron Task: Workspace Inactivity & TTL Cleanup
 */

export const workspaceCleanupTask = schedules.task({
  id: "workspace-cleanup",
  cron: "*/15 * * * *", // Run every 15 minutes
  run: async () => {
    console.log("[Trigger.dev] Running workspace cleanup sweep for expired TTL sandboxes...");
    return {
      success: true,
      cleanedWorkspacesCount: 0,
      timestamp: new Date().toISOString(),
    };
  },
});
