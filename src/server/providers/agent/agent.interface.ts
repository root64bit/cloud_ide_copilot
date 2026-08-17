import type { IncidentDiagnosis, RepairPlan } from "../ai/ai.interface";

export interface CodingAgentTaskContext {
  workspaceId: string;
  repoOwner: string;
  repoName: string;
  branch?: string;
  incidentTitle: string;
  diagnosis: IncidentDiagnosis;
  instructions?: string;
}

export interface CodingAgentResult {
  patchApplied: boolean;
  modifiedFiles: string[];
  diff: string;
  summary: string;
  repairPlan: RepairPlan;
  provider: "openhands" | string;
  externalRunId?: string;
  conversationId?: string;
  sandboxId?: string;
  conversationUrl?: string;
  executionStatus?: string;
}

export interface CodingAgent {
  analyzeWorkspace(context: CodingAgentTaskContext): Promise<IncidentDiagnosis>;
  proposePatch(context: CodingAgentTaskContext): Promise<CodingAgentResult>;
  continueTask(conversationId: string, instruction: string): Promise<CodingAgentResult>;
}
