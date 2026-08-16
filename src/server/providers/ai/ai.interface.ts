import { z } from "zod";

export const IncidentDiagnosisSchema = z.object({
  summary: z.string(),
  probableRootCause: z.string(),
  confidence: z.number().min(0).max(1),
  suspectedFiles: z.array(z.string()),
  recommendedChanges: z.array(z.string()),
  risks: z.array(z.string()),
  recommendedTests: z.array(z.string()),
  missingInformation: z.array(z.string()).optional(),
});

export type IncidentDiagnosis = z.infer<typeof IncidentDiagnosisSchema>;

export const RepairPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  filesToModify: z.array(
    z.object({
      filePath: z.string(),
      description: z.string(),
      originalSnippet: z.string().optional(),
      replacementSnippet: z.string(),
    })
  ),
  testFilesToCreateOrUpdate: z.array(
    z.object({
      filePath: z.string(),
      testCode: z.string(),
    })
  ),
  validationSteps: z.array(z.string()),
});

export type RepairPlan = z.infer<typeof RepairPlanSchema>;

export const RiskReviewSchema = z.object({
  passedReview: z.boolean(),
  safetyScore: z.number().min(0).max(100),
  breakingChangeRisk: z.enum(["low", "medium", "high"]),
  performanceImpact: z.string(),
  securityImpact: z.string(),
  reviewNotes: z.array(z.string()),
});

export type RiskReview = z.infer<typeof RiskReviewSchema>;

export type ModelTier = "analysis" | "coding" | "review" | "fast";

export interface AIProvider {
  diagnoseIncident(incidentContext: {
    title: string;
    level: string;
    environment: string;
    stacktrace: Array<{ filename: string; lineno: number; function: string }>;
    codeSnippets?: Record<string, string>;
  }): Promise<IncidentDiagnosis>;

  proposeRepair(context: {
    incidentTitle: string;
    diagnosis: IncidentDiagnosis;
    relevantFiles: Record<string, string>;
  }): Promise<RepairPlan>;

  reviewRepair(context: {
    diff: string;
    testOutput: string;
    incidentTitle: string;
  }): Promise<RiskReview>;
}
