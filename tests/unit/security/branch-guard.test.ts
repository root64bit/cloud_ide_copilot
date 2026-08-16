import { SecurityViolationError } from "@/lib/errors";
import { assertSafeRepairBranch, generateRepairBranchName } from "@/lib/security/branch-guard";
import { describe, expect, it } from "vitest";

describe("Protected Branch Guard & Naming", () => {
  it("rejects direct repair targeting protected branches", () => {
    expect(() => assertSafeRepairBranch("main")).toThrowError(SecurityViolationError);
    expect(() => assertSafeRepairBranch("master")).toThrowError(SecurityViolationError);
    expect(() => assertSafeRepairBranch("production")).toThrowError(SecurityViolationError);
    expect(() => assertSafeRepairBranch("prod")).toThrowError(SecurityViolationError);
    expect(() => assertSafeRepairBranch("release")).toThrowError(SecurityViolationError);
  });

  it("rejects branch names not following 'ai-repair/' prefix convention", () => {
    expect(() => assertSafeRepairBranch("feat/new-feature")).toThrowError(SecurityViolationError);
    expect(() => assertSafeRepairBranch("hotfix-123")).toThrowError(SecurityViolationError);
  });

  it("accepts valid ai-repair branch names", () => {
    expect(() => assertSafeRepairBranch("ai-repair/onedealer-fix-9284")).not.toThrow();
    expect(() => assertSafeRepairBranch("ai-repair/yaka-coupon-patch-v2")).not.toThrow();
  });

  it("generates deterministic and safe repair branch names", () => {
    const branch = generateRepairBranchName("onedealer", "fix");
    expect(branch).toMatch(/^ai-repair\/onedealer-fix-[a-z0-9]+$/);
  });
});
