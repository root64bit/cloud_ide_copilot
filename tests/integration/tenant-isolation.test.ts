import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { ProjectService } from "@/server/services/project.service";
import { describe, expect, it } from "vitest";

describe("Tenant & Organization Isolation Integration Tests", () => {
  const orgA = "00000000-0000-0000-0000-000000000001";
  const orgB = "00000000-0000-0000-0000-000000000002"; // Unaffiliated Org

  it("rejects unauthenticated requests without session credentials", async () => {
    await expect(
      ProjectService.listProjects(undefined as any, orgA)
    ).rejects.toThrowError(UnauthorizedError);
  });

  it("rejects access when user is not a member of the target organization", async () => {
    // user_owner is member of orgA, but not orgB
    await expect(
      ProjectService.listProjects("user_owner", orgB)
    ).rejects.toThrowError(ForbiddenError);
  });

  it("allows authorized organization members to view their own projects", async () => {
    const projects = await ProjectService.listProjects("user_owner", orgA);
    expect(projects.length).toBeGreaterThan(0);
    expect(projects[0].organization_id).toBe(orgA);
  });
});
