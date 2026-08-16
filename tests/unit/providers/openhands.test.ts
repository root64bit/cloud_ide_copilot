import { OpenHandsAgentProvider } from "@/server/providers/agent/openhands.provider";
import { OpenRouterAIProvider } from "@/server/providers/ai/openrouter.provider";
import { MockSandboxProvider } from "@/server/providers/sandbox/mock-sandbox.provider";
import { describe, expect, it } from "vitest";

describe("OpenHands Coding Agent Layer", () => {
  const aiProvider = new OpenRouterAIProvider();
  const sandboxProvider = new MockSandboxProvider();
  const agent = new OpenHandsAgentProvider(aiProvider, sandboxProvider);

  it("proposes and applies surgical bugfix patches to sandbox workspace", async () => {
    const diagnosis = await aiProvider.diagnoseIncident({
      title: "TypeError: discountCode undefined",
      level: "error",
      environment: "production",
      stacktrace: [],
    });

    const result = await agent.proposePatch({
      workspaceId: "sbx_test",
      repoOwner: "acme-inc",
      repoName: "onedealer",
      incidentTitle: "TypeError in pricing",
      diagnosis,
    });

    expect(result.patchApplied).toBe(true);
    expect(result.modifiedFiles).toContain("src/lib/checkout/pricing.ts");
    expect(sandboxProvider.files.has("tests/pricing.test.ts")).toBe(true);
  });
});
