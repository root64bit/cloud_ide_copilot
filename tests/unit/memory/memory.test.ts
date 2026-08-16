import { DatabaseMemoryProvider } from "@/server/providers/memory/database-memory.provider";
import { describe, expect, it } from "vitest";

describe("Project Memory Layer (Scoped Tenant Isolation)", () => {
  const memoryProvider = new DatabaseMemoryProvider();
  const orgA = "00000000-0000-0000-0000-000000000001";
  const orgB = "00000000-0000-0000-0000-000000000002";
  const proj1 = "10000000-0000-0000-0000-000000000001";

  it("stores and retrieves project architecture memory within scoped organization", async () => {
    await memoryProvider.remember({
      organizationId: orgA,
      projectId: proj1,
      memoryType: "architecture",
      title: "Checkout Architecture",
      content: "All pricing logic resides in src/lib/checkout/pricing.ts using strict null checks.",
      tags: ["pricing", "checkout"],
    });

    const resultsA = await memoryProvider.search({
      organizationId: orgA,
      projectId: proj1,
      query: "pricing",
    });

    expect(resultsA.length).toBeGreaterThan(0);
    expect(resultsA[0].entry.title).toBe("Checkout Architecture");

    // Strictly verify cross-tenant isolation: Org B searching cannot see Org A memories
    const resultsB = await memoryProvider.search({
      organizationId: orgB,
      projectId: proj1,
      query: "pricing",
    });

    expect(resultsB.length).toBe(0);
  });
});
