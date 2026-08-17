import { redactSecrets } from "@/lib/security/redaction";
import {
  type AIProvider,
  type IncidentDiagnosis,
  IncidentDiagnosisSchema,
  type ModelTier,
  type RepairPlan,
  RepairPlanSchema,
  type RiskReview,
  RiskReviewSchema,
} from "./ai.interface";
import {
  SYSTEM_INCIDENT_DIAGNOSIS_PROMPT,
  SYSTEM_REPAIR_PROPOSAL_PROMPT,
  SYSTEM_RISK_REVIEW_PROMPT,
} from "./prompts";

export class OpenRouterAIProvider implements AIProvider {
  private apiKey: string;
  private modelMap: Record<ModelTier, string>;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || "";
    const defaultModel = process.env.OPENROUTER_MODEL || "openrouter/auto";
    this.modelMap = {
      analysis: process.env.OPENROUTER_ANALYSIS_MODEL || defaultModel,
      coding: process.env.OPENROUTER_CODING_MODEL || defaultModel,
      review: process.env.OPENROUTER_REVIEW_MODEL || defaultModel,
      fast: process.env.OPENROUTER_FAST_MODEL || defaultModel,
    };
  }

  private async callOpenRouter(
    modelTier: ModelTier,
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    const sanitizedUserPrompt = redactSecrets(userPrompt);

    if (!this.apiKey) {
      if (process.env.NODE_ENV === "test" || process.env.ALLOW_MOCK_PROVIDERS === "true") {
        return this.getMockResponse(modelTier);
      }
      throw new Error("OpenRouter is not configured. Set OPENROUTER_API_KEY before running AI analysis.");
    }

    const model = this.modelMap[modelTier];
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://cloud-ide-copilot.vercel.app",
        "X-Title": "Cloud IDE Copilot",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: sanitizedUserPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "{}";
  }

  async diagnoseIncident(incidentContext: {
    title: string;
    level: string;
    environment: string;
    stacktrace: Array<{ filename: string; lineno: number; function: string }>;
    codeSnippets?: Record<string, string>;
  }): Promise<IncidentDiagnosis> {
    const rawOutput = await this.callOpenRouter(
      "analysis",
      SYSTEM_INCIDENT_DIAGNOSIS_PROMPT,
      JSON.stringify(incidentContext)
    );

    const parsed = JSON.parse(rawOutput.replace(/```json\n?|```/g, "").trim());
    return IncidentDiagnosisSchema.parse(parsed);
  }

  async proposeRepair(context: {
    incidentTitle: string;
    diagnosis: IncidentDiagnosis;
    relevantFiles: Record<string, string>;
  }): Promise<RepairPlan> {
    const rawOutput = await this.callOpenRouter(
      "coding",
      SYSTEM_REPAIR_PROPOSAL_PROMPT,
      JSON.stringify(context)
    );

    const parsed = JSON.parse(rawOutput.replace(/```json\n?|```/g, "").trim());
    return RepairPlanSchema.parse(parsed);
  }

  async reviewRepair(context: {
    diff: string;
    testOutput: string;
    incidentTitle: string;
  }): Promise<RiskReview> {
    const rawOutput = await this.callOpenRouter(
      "review",
      SYSTEM_RISK_REVIEW_PROMPT,
      JSON.stringify(context)
    );

    const parsed = JSON.parse(rawOutput.replace(/```json\n?|```/g, "").trim());
    return RiskReviewSchema.parse(parsed);
  }

  private getMockResponse(modelTier: ModelTier): string {
    if (modelTier === "analysis") {
      return JSON.stringify({
        summary: "Unchecked access on optional discountCode property in pricing calculation.",
        probableRootCause:
          "calculateTotal assumes discountCode is always present on cart items, throwing TypeError when empty cart or coupon-less item is processed.",
        confidence: 0.94,
        suspectedFiles: ["src/lib/checkout/pricing.ts"],
        recommendedChanges: [
          "Use optional chaining `discount?.code` and provide safe fallback amount.",
        ],
        risks: ["Zero-dollar pricing if discount object is malformed."],
        recommendedTests: [
          "Unit test for checkout calculation without discount coupon object.",
        ],
        missingInformation: [],
      });
    }

    if (modelTier === "coding") {
      return JSON.stringify({
        title: "Defensive check for undefined discount code in calculateTotal",
        description:
          "Adds optional chaining and fallback to prevent TypeError when discount parameter is omitted.",
        filesToModify: [
          {
            filePath: "src/lib/checkout/pricing.ts",
            description: "Safely handle optional discountCode property",
            replacementSnippet:
              "export function calculateTotal(subtotal: number, discount?: { code?: string; percent?: number }) {\n  const pct = discount?.percent ?? 0;\n  return subtotal * (1 - pct / 100);\n}",
          },
        ],
        testFilesToCreateOrUpdate: [
          {
            filePath: "tests/pricing.test.ts",
            testCode:
              "import { calculateTotal } from '../src/lib/checkout/pricing';\n\ntest('handles missing discount safely', () => {\n  expect(calculateTotal(100, undefined)).toBe(100);\n});",
          },
        ],
        validationSteps: ["npm test", "npx tsc --noEmit"],
      });
    }

    return JSON.stringify({
      passedReview: true,
      safetyScore: 98,
      breakingChangeRisk: "low",
      performanceImpact: "Negligible O(1) null check",
      securityImpact: "Prevents unhandled runtime crashes in production checkout endpoint",
      reviewNotes: [
        "Defensive coding conforms to TypeScript strict standards",
        "Includes automated regression unit test",
      ],
    });
  }
}
