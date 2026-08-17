import { task } from "@trigger.dev/sdk";

/**
 * Cleanup orchestration boundary. It is deliberately NOT scheduled yet because workspace
 * persistence and real sandbox deletion are not wired end-to-end. Scheduling a no-op would
 * waste compute and could hide leaked sandboxes.
 */
export const workspaceCleanupTask = task({
  id: "workspace-cleanup",
  run: async () => {
    throw new Error(
      "WORKSPACE_CLEANUP_NOT_WIRED: enable persistent Supabase workspace storage and the real sandbox provider before scheduling cleanup."
    );
  },
});
