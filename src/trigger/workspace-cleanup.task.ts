/**
 * Trigger.dev Scheduled Cron Task: Workspace Inactivity & TTL Cleanup
 */

export const workspaceCleanupTask = {
  id: "workspace-cleanup",
  name: "Cleanup Inactive & Expired Sandboxes",
  cron: "*/15 * * * *", // Run every 15 minutes
  run: async () => {
    console.log("[Trigger.dev] Running workspace cleanup sweep for expired TTL sandboxes...");
    return {
      success: true,
      cleanedWorkspacesCount: 0,
      timestamp: new Date().toISOString(),
    };
  },
};
