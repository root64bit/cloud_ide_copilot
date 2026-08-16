import { SecurityViolationError } from "../errors";
import type { CommandType } from "../supabase/types";

export interface ProjectCommandConfig {
  packageManager?: string;
  installCommand?: string;
  testCommand?: string;
  lintCommand?: string;
  typecheckCommand?: string;
  buildCommand?: string;
  devCommand?: string;
}

// Strictly forbidden shell metacharacters and constructs when running ad-hoc or configured commands
const FORBIDDEN_SHELL_PATTERNS = [
  /`/, // Backtick command substitution
  /\$\(/, // Command substitution $(...)
  /\|/, // Pipes
  /&/, // Background or logic &&
  /;/, // Command chaining
  />/, // Output redirect
  /</, // Input redirect
  /\brm\s+-rf\s+\//, // Root deletion
  /\bcurl\b/, // Exfiltration via curl
  /\bwget\b/, // Exfiltration via wget
  /\bssh\b/, // SSH attempts
  /\bnc\b/, // Netcat
  /\bpython(?:\d)?\s+-c\b/, // Inlined python execution
  /\bperl\b/, // Perl execution
  /\bbash\s+-c\b/, // Nested bash shell
  /\bsh\s+-c\b/, // Nested sh shell
  /\bsudo\b/, // Sudo privilege escalation
  /\bchmod\b/, // Chmod tampering
  /\bchown\b/, // Chown tampering
];

// Allowed command base binaries
const ALLOWED_BINARIES = new Set([
  "npm",
  "pnpm",
  "yarn",
  "bun",
  "npx",
  "git",
  "node",
  "vitest",
  "jest",
  "eslint",
  "tsc",
  "prettier",
  "next",
  "turbo",
]);

// Allowed subcommands for git
const ALLOWED_GIT_SUBCOMMANDS = new Set([
  "status",
  "diff",
  "log",
  "branch",
  "checkout",
  "rev-parse",
  "show",
  "add",
  "commit",
]);

/**
 * Validates and normalizes a command against security allowlists and project configuration.
 */
export function validateAndResolveCommand(
  commandType: CommandType,
  customCommandString: string | undefined,
  projectConfig: ProjectCommandConfig
): { resolvedCommand: string; binary: string; args: string[] } {
  let commandStr = "";

  // 1. Resolve command string from predefined project config or requested type
  switch (commandType) {
    case "install":
      commandStr = projectConfig.installCommand || "npm ci";
      break;
    case "test":
      commandStr = projectConfig.testCommand || "npm test";
      break;
    case "lint":
      commandStr = projectConfig.lintCommand || "npm run lint";
      break;
    case "typecheck":
      commandStr = projectConfig.typecheckCommand || "npx tsc --noEmit";
      break;
    case "build":
      commandStr = projectConfig.buildCommand || "npm run build";
      break;
    case "dev":
      commandStr = projectConfig.devCommand || "npm run dev";
      break;
    case "git_status":
      commandStr = "git status --short";
      break;
    case "git_diff":
      commandStr = "git diff --stat";
      break;
    case "custom_allowlisted":
      if (!customCommandString || typeof customCommandString !== "string") {
        throw new SecurityViolationError("Custom command string must be provided");
      }
      commandStr = customCommandString.trim();
      break;
    default:
      throw new SecurityViolationError(`Unsupported command type: ${commandType}`);
  }

  // 2. Scan for dangerous shell metacharacters
  for (const pattern of FORBIDDEN_SHELL_PATTERNS) {
    if (pattern.test(commandStr)) {
      throw new SecurityViolationError(
        `Command contains forbidden shell metacharacter or pattern: ${pattern.toString()}`
      );
    }
  }

  // 3. Tokenize into binary and arguments
  const tokens = commandStr.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    throw new SecurityViolationError("Empty command");
  }

  const binary = tokens[0];
  const args = tokens.slice(1);

  // 4. Verify binary is in global allowlist
  if (!ALLOWED_BINARIES.has(binary)) {
    throw new SecurityViolationError(`Binary '${binary}' is not permitted in the sandbox`);
  }

  // 5. Special checks for git commands
  if (binary === "git") {
    const gitSubcommand = args[0];
    if (!gitSubcommand || !ALLOWED_GIT_SUBCOMMANDS.has(gitSubcommand)) {
      throw new SecurityViolationError(
        `Git subcommand '${gitSubcommand}' is not permitted in the sandbox`
      );
    }
  }

  return {
    resolvedCommand: commandStr,
    binary,
    args,
  };
}

/**
 * Truncates stdout/stderr safely to prevent storage exhaustion.
 */
export function truncateOutput(output: string, maxBytes = 32768): string {
  if (!output) return "";
  if (output.length <= maxBytes) return output;
  const half = Math.floor(maxBytes / 2);
  const head = output.slice(0, half);
  const tail = output.slice(-half);
  return `${head}\n\n[... TRUNCATED ${output.length - maxBytes} BYTES FOR STORAGE EFFICIENCY ...]\n\n${tail}`;
}
