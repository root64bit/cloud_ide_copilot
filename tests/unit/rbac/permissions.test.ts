import { hasPermission, ROLE_PERMISSIONS } from "@/server/rbac/permissions";
import { hasRoleAtLeast, ROLE_HIERARCHY } from "@/server/rbac/roles";
import { describe, expect, it } from "vitest";

describe("RBAC Hierarchy & Permission Matrix", () => {
  it("enforces role level hierarchy (owner > admin > engineer > viewer)", () => {
    expect(hasRoleAtLeast("owner", "admin")).toBe(true);
    expect(hasRoleAtLeast("admin", "engineer")).toBe(true);
    expect(hasRoleAtLeast("engineer", "viewer")).toBe(true);
    expect(hasRoleAtLeast("viewer", "engineer")).toBe(false);
    expect(hasRoleAtLeast("engineer", "admin")).toBe(false);
  });

  it("grants viewer read-only permissions", () => {
    expect(hasPermission("viewer", "project:view")).toBe(true);
    expect(hasPermission("viewer", "incident:view")).toBe(true);
    expect(hasPermission("viewer", "workspace:create")).toBe(false);
    expect(hasPermission("viewer", "workspace:execute_command")).toBe(false);
    expect(hasPermission("viewer", "deployment:approve_production")).toBe(false);
  });

  it("grants engineer sandbox & AI permissions but blocks production merge approval", () => {
    expect(hasPermission("engineer", "workspace:create")).toBe(true);
    expect(hasPermission("engineer", "workspace:execute_command")).toBe(true);
    expect(hasPermission("engineer", "workspace:run_ai_repair")).toBe(true);
    expect(hasPermission("engineer", "workspace:validate")).toBe(true);
    expect(hasPermission("engineer", "workspace:create_pr")).toBe(true);
    // Strict production security constraint:
    expect(hasPermission("engineer", "deployment:approve_production")).toBe(false);
  });

  it("grants admin and owner production approval and member management", () => {
    expect(hasPermission("admin", "deployment:approve_production")).toBe(true);
    expect(hasPermission("admin", "org:manage_members")).toBe(true);
    expect(hasPermission("owner", "deployment:approve_production")).toBe(true);
    expect(hasPermission("owner", "org:manage_billing")).toBe(true);
    expect(hasPermission("owner", "org:delete")).toBe(true);
  });
});
