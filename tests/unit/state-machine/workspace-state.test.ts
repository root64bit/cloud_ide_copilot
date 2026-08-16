import { InvalidStateTransitionError } from "@/lib/errors";
import { WorkspaceStateMachine } from "@/server/state-machine/workspace-state";
import { describe, expect, it } from "vitest";

describe("Workspace State Machine & Validation Gate", () => {
  it("allows standard linear workflow transitions", () => {
    expect(WorkspaceStateMachine.canTransition("creating", "cloning")).toBe(true);
    expect(WorkspaceStateMachine.canTransition("cloning", "ready")).toBe(true);
    expect(WorkspaceStateMachine.canTransition("ready", "analyzing")).toBe(true);
    expect(WorkspaceStateMachine.canTransition("analyzing", "repairing")).toBe(true);
    expect(WorkspaceStateMachine.canTransition("repairing", "validating")).toBe(true);
  });

  it("blocks transition to ready_for_review if validation checks failed", () => {
    expect(() =>
      WorkspaceStateMachine.transition("validating", "ready_for_review", {
        validationPassed: false,
      })
    ).toThrowError(InvalidStateTransitionError);
  });

  it("permits transition to ready_for_review when validation checks pass", () => {
    const next = WorkspaceStateMachine.transition("validating", "ready_for_review", {
      validationPassed: true,
    });
    expect(next).toBe("ready_for_review");
  });

  it("blocks direct jump from creating to merged or completed", () => {
    expect(() => WorkspaceStateMachine.transition("creating", "merged")).toThrowError(
      InvalidStateTransitionError
    );
    expect(() => WorkspaceStateMachine.transition("ready", "completed")).toThrowError(
      InvalidStateTransitionError
    );
  });

  it("requires explicit human approval before transition to merged", () => {
    expect(() =>
      WorkspaceStateMachine.transition("approved", "merged", { humanApproved: false })
    ).toThrowError(InvalidStateTransitionError);

    const merged = WorkspaceStateMachine.transition("approved", "merged", { humanApproved: true });
    expect(merged).toBe("merged");
  });
});
