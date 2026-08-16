import { SecurityViolationError } from "../errors";

// Branches strictly protected against direct pushes or automated AI commits
const PROTECTED_BRANCHES = new Set([
  "main",
  "master",
  "production",
  "prod",
  "release",
  "staging",
  "develop",
]);

/**
 * Asserts that a target branch is safe for automated repair pushes.
 * Throws SecurityViolationError if attempting to write directly to protected branches.
 */
export function assertSafeRepairBranch(branchName: string, productionBranch = "main"): void {
  if (!branchName || typeof branchName !== "string") {
    throw new SecurityViolationError("Branch name must be provided");
  }

  const normalized = branchName.trim().toLowerCase();

  if (PROTECTED_BRANCHES.has(normalized) || normalized === productionBranch.toLowerCase()) {
    throw new SecurityViolationError(
      `Direct push or modification to protected branch '${branchName}' is strictly forbidden. All repairs must target an isolated repair branch.`
    );
  }

  // Branch names must follow git ref naming standards and prefix conventions
  const validBranchPattern = /^ai-repair\/[a-zA-Z0-9_\-\.\/]+$/;
  if (!validBranchPattern.test(branchName)) {
    throw new SecurityViolationError(
      `Repair branch name '${branchName}' must follow convention 'ai-repair/<slug>' and contain only alphanumeric, dash, dot, or slash characters.`
    );
  }
}

/**
 * Generates a clean, deterministic repair branch name.
 */
export function generateRepairBranchName(identifier: string, suffix?: string): string {
  const cleanId = identifier
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/^-+|-+$/g, "");
  const timestamp = Date.now().toString(36);
  return `ai-repair/${cleanId}${suffix ? `-${suffix}` : ""}-${timestamp}`;
}
