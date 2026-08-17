import type { RepairPlan } from "../ai/ai.interface";
import type {
  CodingAgent,
  CodingAgentResult,
  CodingAgentTaskContext,
} from "./agent.interface";
import { OpenHandsCloudClient } from "./openhands-cloud.client";

function extractPath(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  for (const key of ["path", "file_path", "filename", "new_path", "name"]) {
    if (typeof record[key] === "string") return record[key] as string;
  }
  return null;
}

function normalizeChangedFiles(payload: unknown): string[] {
  if (Array.isArray(payload)) {
    return [...new Set(payload.map(extractPath).filter((value): value is string => Boolean(value)))];
  }

  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;

  for (const key of ["files", "changes", "items", "modified_files"]) {
    if (Array.isArray(record[key])) {
      return normalizeChangedFiles(record[key]);
    }
  }

  return [];
}

function buildRepairPrompt(context: CodingAgentTaskContext) {
  const diagnosis = context.diagnosis;
  const additional = context.instructions ? `\nAdditional operator instructions:\n${context.instructions}\n` : "";

  return `You are operating as the coding agent for a controlled production-repair workflow.

Repository: ${context.repoOwner}/${context.repoName}
Incident: ${context.incidentTitle}
Probable root cause: ${diagnosis.probableRootCause}
Confidence: ${diagnosis.confidence}
Suspected files: ${diagnosis.suspectedFiles.join(", ") || "unknown"}
Recommended fix: ${diagnosis.recommendedChanges.join("; ") || "none supplied"}
Regression risks: ${diagnosis.risks.join("; ") || "none supplied"}
Recommended tests: ${diagnosis.recommendedTests.join("; ") || "none supplied"}
${additional}
MANDATORY SAFETY RULES:
1. Inspect the repository before editing.
2. Make the smallest correct repair for this incident.
3. Add or update focused tests where appropriate.
4. You MAY run repository tests or static checks to understand your change.
5. DO NOT commit, push, create a pull request, merge, or deploy.
6. DO NOT modify CI/CD secrets, environment files, private keys, deployment credentials, or production data.
7. Leave all source changes UNCOMMITTED in the OpenHands working tree so this platform can inspect the real git diff.
8. Do not claim a test passed unless you actually ran it and saw a successful result.
9. If the repair is unsafe or information is missing, stop without making speculative changes.

Finish only after the working tree contains the proposed source/test changes or after determining that no safe repair can be made.`;
}

export class OpenHandsAgentProvider implements CodingAgent {
  constructor(private readonly client = new OpenHandsCloudClient()) {}

  async analyzeWorkspace(context: CodingAgentTaskContext) {
    return context.diagnosis;
  }

  async proposePatch(context: CodingAgentTaskContext): Promise<CodingAgentResult> {
    if (!this.client.isConfigured()) {
      throw new Error("OpenHands Cloud is not configured. Set OPENHANDS_API_KEY before running an AI repair.");
    }

    const model = process.env.OPENHANDS_MODEL || undefined;
    const execution = await this.client.runConversation({
      repository: `${context.repoOwner}/${context.repoName}`,
      branch: context.branch,
      model,
      message: buildRepairPrompt(context),
      observabilityTags: ["cloud-ide-copilot", "repair", `workspace:${context.workspaceId}`],
      observabilityMetadata: {
        workspace_id: context.workspaceId,
        repository: `${context.repoOwner}/${context.repoName}`,
      },
    });

    const repoPath = process.env.OPENHANDS_GIT_WORKSPACE_PATH || "/workspace/project";
    const rawChanges = await this.client.getGitChanges(execution.conversationId, repoPath);
    let modifiedFiles = normalizeChangedFiles(rawChanges);

    const diffs: string[] = [];
    for (const changedFile of modifiedFiles) {
      const absolutePath = changedFile.startsWith("/")
        ? changedFile
        : `${repoPath.replace(/\/$/, "")}/${changedFile.replace(/^\//, "")}`;
      try {
        const diff = await this.client.getFileDiff(execution.conversationId, absolutePath);
        if (diff.trim()) diffs.push(diff);
      } catch (error) {
        diffs.push(`Unable to retrieve diff for ${changedFile}: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }

    const combinedDiff = diffs.join("\n\n");

    // Fallback: if the changes endpoint shape evolves, derive filenames from unified diff headers.
    if (modifiedFiles.length === 0 && combinedDiff) {
      modifiedFiles = [...combinedDiff.matchAll(/^\+\+\+ b\/(.+)$/gm)].map((match) => match[1]);
    }

    const patchApplied = modifiedFiles.length > 0 || combinedDiff.trim().length > 0;
    const repairPlan: RepairPlan = {
      title: patchApplied ? `OpenHands repair for ${context.incidentTitle}` : "OpenHands completed without source changes",
      description: patchApplied
        ? `OpenHands completed a real Cloud conversation and left ${modifiedFiles.length || "one or more"} uncommitted change(s) for review.`
        : "OpenHands completed successfully but no git changes were detected. Review the conversation before continuing.",
      filesToModify: modifiedFiles.map((filePath) => ({
        filePath,
        description: "Modified by OpenHands Cloud. Review the raw unified diff before synchronization or validation.",
        originalSnippet: "",
        replacementSnippet: "",
      })),
      testFilesToCreateOrUpdate: [],
      validationSteps: ["npm test", "npm run lint", "npm run typecheck", "npm run build"],
    };

    return {
      patchApplied,
      modifiedFiles,
      diff: combinedDiff || "No git diff was returned by OpenHands Cloud.",
      summary: repairPlan.description,
      repairPlan,
      provider: "openhands",
      externalRunId: execution.startTaskId,
      conversationId: execution.conversationId,
      sandboxId: execution.sandboxId,
      conversationUrl: execution.conversationUrl,
      executionStatus: execution.executionStatus,
    };
  }

  async continueTask(conversationId: string, instruction: string): Promise<CodingAgentResult> {
    await this.client.sendMessage(conversationId, instruction);
    const conversation = await this.client.waitForCompletion(conversationId);
    const repoPath = process.env.OPENHANDS_GIT_WORKSPACE_PATH || "/workspace/project";
    const rawChanges = await this.client.getGitChanges(conversationId, repoPath);
    const modifiedFiles = normalizeChangedFiles(rawChanges);
    const diffs: string[] = [];

    for (const changedFile of modifiedFiles) {
      const absolutePath = changedFile.startsWith("/")
        ? changedFile
        : `${repoPath.replace(/\/$/, "")}/${changedFile.replace(/^\//, "")}`;
      diffs.push(await this.client.getFileDiff(conversationId, absolutePath));
    }

    const repairPlan: RepairPlan = {
      title: "OpenHands follow-up repair",
      description: instruction,
      filesToModify: modifiedFiles.map((filePath) => ({
        filePath,
        description: "Updated by OpenHands follow-up instruction.",
        originalSnippet: "",
        replacementSnippet: "",
      })),
      testFilesToCreateOrUpdate: [],
      validationSteps: ["npm test", "npm run lint", "npm run typecheck", "npm run build"],
    };

    return {
      patchApplied: modifiedFiles.length > 0,
      modifiedFiles,
      diff: diffs.join("\n\n"),
      summary: instruction,
      repairPlan,
      provider: "openhands",
      conversationId,
      conversationUrl: this.client.getConversationUrl(conversationId),
      executionStatus: conversation.execution_status || "finished",
    };
  }
}
