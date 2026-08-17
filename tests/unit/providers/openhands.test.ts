import { OpenHandsCloudClient } from "@/server/providers/agent/openhands-cloud.client";
import { OpenHandsAgentProvider } from "@/server/providers/agent/openhands.provider";
import { describe, expect, it } from "vitest";

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("OpenHands Cloud coding agent", () => {
  it("runs a real-API-shaped conversation and returns actual git changes/diff", async () => {
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);

      if (url.endsWith("/api/v1/app-conversations") && init?.method === "POST") {
        return jsonResponse({
          id: "start_task_1",
          status: "READY",
          app_conversation_id: "11111111-1111-4111-8111-111111111111",
          sandbox_id: "sandbox_real_shape",
        });
      }

      if (url.includes("/api/v1/app-conversations?ids=")) {
        return jsonResponse([
          {
            id: "11111111-1111-4111-8111-111111111111",
            sandbox_status: "RUNNING",
            execution_status: "FINISHED",
          },
        ]);
      }

      if (url.includes("/git/changes?")) {
        return jsonResponse([{ path: "src/lib/checkout/pricing.ts" }]);
      }

      if (url.includes("/git/diff?")) {
        return jsonResponse(
          "--- a/src/lib/checkout/pricing.ts\n+++ b/src/lib/checkout/pricing.ts\n@@ -1 +1 @@\n-old\n+new"
        );
      }

      return jsonResponse({ error: "unexpected test URL", url }, 500);
    };

    const client = new OpenHandsCloudClient({
      apiKey: "test-key",
      fetchImpl,
      pollIntervalMs: 1,
      startTimeoutMs: 100,
      executionTimeoutMs: 100,
    });
    const agent = new OpenHandsAgentProvider(client);

    const result = await agent.proposePatch({
      workspaceId: "ws_test",
      repoOwner: "root64bit",
      repoName: "cloud-ide-copilot",
      branch: "main",
      incidentTitle: "TypeError in pricing",
      diagnosis: {
        summary: "Missing null guard",
        probableRootCause: "discountCode can be undefined",
        confidence: 0.95,
        suspectedFiles: ["src/lib/checkout/pricing.ts"],
        recommendedChanges: ["Guard optional discountCode before dereferencing it"],
        risks: ["pricing behavior"],
        recommendedTests: ["missing discountCode"],
        missingInformation: [],
      },
    });

    expect(result.patchApplied).toBe(true);
    expect(result.modifiedFiles).toEqual(["src/lib/checkout/pricing.ts"]);
    expect(result.diff).toContain("+++ b/src/lib/checkout/pricing.ts");
    expect(result.conversationId).toBe("11111111-1111-4111-8111-111111111111");
    expect(result.provider).toBe("openhands");
  });
});
