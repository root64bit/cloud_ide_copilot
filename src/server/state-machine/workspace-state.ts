import { InvalidStateTransitionError } from "@/lib/errors";
import type { WorkspaceStatus } from "@/lib/supabase/types";

// Explicit State Transition Graph
const ALLOWED_TRANSITIONS: Record<WorkspaceStatus, WorkspaceStatus[]> = {
  creating: ["cloning", "failed", "stopped"],
  cloning: ["ready", "failed", "stopped"],
  ready: ["analyzing", "repairing", "validating", "stopped", "expired"],
  analyzing: ["ready", "repairing", "failed", "stopped"],
  repairing: ["validating", "ready", "failed", "stopped"],
  validating: ["ready_for_review", "validation_failed", "failed", "stopped"],
  validation_failed: ["repairing", "validating", "ready", "stopped"],
  ready_for_review: ["pr_created", "repairing", "stopped"],
  pr_created: ["preview_building", "preview_ready", "stopped"],
  preview_building: ["preview_ready", "failed", "stopped"],
  preview_ready: ["approved", "rejected", "stopped"],
  approved: ["merged", "stopped"],
  rejected: ["repairing", "stopped"],
  merged: ["completed", "stopped"],
  completed: [], // Terminal
  failed: ["ready", "stopped"],
  stopped: [], // Terminal
  expired: [], // Terminal
};

export class WorkspaceStateMachine {
  /**
   * Asserts whether a transition between two states is valid according to the state graph.
   */
  public static canTransition(current: WorkspaceStatus, next: WorkspaceStatus): boolean {
    const allowed = ALLOWED_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  /**
   * Validates and executes a transition, throwing InvalidStateTransitionError if invalid.
   */
  public static transition(
    current: WorkspaceStatus,
    next: WorkspaceStatus,
    context?: { validationPassed?: boolean; humanApproved?: boolean }
  ): WorkspaceStatus {
    if (!this.canTransition(current, next)) {
      throw new InvalidStateTransitionError(
        current,
        next,
        `Direct transition from '${current}' to '${next}' is disallowed by the repair state machine`
      );
    }

    // Specific Gate: Cannot transition to ready_for_review unless validation passed
    if (next === "ready_for_review" && context && context.validationPassed === false) {
      throw new InvalidStateTransitionError(
        current,
        next,
        "Cannot transition to 'ready_for_review' while automated validation checks are failing"
      );
    }

    // Specific Gate: Cannot transition to merged unless human approval is granted
    if (next === "merged" && context && context.humanApproved === false) {
      throw new InvalidStateTransitionError(
        current,
        next,
        "Cannot merge repair to production without explicit human authorization"
      );
    }

    return next;
  }
}
