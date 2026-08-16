import { OpenRouterAIProvider } from "@/server/providers/ai/openrouter.provider";
import { describe, expect, it } from "vitest";

describe("OpenRouter AI Provider & Structured Zod Output", () => {
  const provider = new OpenRouterAIProvider();

  it("diagnoses an incident with structured schema validation", async () => {
    const diagnosis = await provider.diagnoseIncident({
      title: "TypeError: Cannot read properties of undefined (reading 'discountCode')",
      level: "error",
      environment: "production",
      stacktrace: [
        { filename: "src/lib/checkout/pricing.ts", lineno: 48, function: "calculateTotal" },
      ],
    });

    expect(diagnosis.confidence).toBeGreaterThan(0.5);
    expect(diagnosis.suspectedFiles).toContain("src/lib/checkout/pricing.ts");
    expect(diagnosis.recommendedTests.length).toBeGreaterThan(0);
  });

  it("proposes structured repair plan with safe file replacements", async () => {
    const diagnosis = await provider.diagnoseIncident({
      title: "TypeError: Cannot read properties of undefined",
      level: "error",
      environment: "production",
      stacktrace: [],
    });

    const repairPlan = await provider.proposeRepair({
      incidentTitle: "TypeError in pricing",
      diagnosis,
      relevantFiles: {
        "src/lib/checkout/pricing.ts": "export function calculateTotal() {}",
      },
    });

    expect(repairPlan.filesToModify.length).toBeGreaterThan(0);
    expect(repairPlan.filesToModify[0].filePath).toBe("src/lib/checkout/pricing.ts");
    expect(repairPlan.testFilesToCreateOrUpdate.length).toBeGreaterThan(0);
  });

  it("reviews repair diff with safety scoring", async () => {
    const review = await provider.reviewRepair({
      diff: "modified src/lib/checkout/pricing.ts",
      testOutput: "PASS 1 test passed",
      incidentTitle: "TypeError fix",
    });

    expect(review.passedReview).toBe(true);
    expect(review.safetyScore).toBeGreaterThanOrEqual(90);
    expect(review.breakingChangeRisk).toBe("low");
  });
});
