import type { UserRole } from "@/lib/supabase/types";

export type Permission =
  // Project Permissions
  | "project:view"
  | "project:create"
  | "project:update"
  | "project:delete"
  // Incident Permissions
  | "incident:view"
  | "incident:diagnose"
  | "incident:resolve"
  // Workspace Permissions
  | "workspace:view"
  | "workspace:create"
  | "workspace:execute_command"
  | "workspace:edit_code"
  | "workspace:run_ai_repair"
  | "workspace:validate"
  | "workspace:create_pr"
  | "workspace:stop"
  // Deployment & Approval Permissions
  | "deployment:view"
  | "deployment:approve_production"
  | "deployment:merge_pr"
  // Organization & Admin Permissions
  | "org:manage_members"
  | "org:manage_integrations"
  | "org:view_audit_logs"
  | "org:manage_billing"
  | "org:delete";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  viewer: [
    "project:view",
    "incident:view",
    "workspace:view",
    "deployment:view",
    "org:view_audit_logs",
  ],
  engineer: [
    // Viewer permissions
    "project:view",
    "incident:view",
    "workspace:view",
    "deployment:view",
    "org:view_audit_logs",
    // Engineer permissions
    "project:create",
    "project:update",
    "incident:diagnose",
    "incident:resolve",
    "workspace:create",
    "workspace:execute_command",
    "workspace:edit_code",
    "workspace:run_ai_repair",
    "workspace:validate",
    "workspace:create_pr",
    "workspace:stop",
  ],
  admin: [
    // Engineer permissions
    "project:view",
    "incident:view",
    "workspace:view",
    "deployment:view",
    "org:view_audit_logs",
    "project:create",
    "project:update",
    "project:delete",
    "incident:diagnose",
    "incident:resolve",
    "workspace:create",
    "workspace:execute_command",
    "workspace:edit_code",
    "workspace:run_ai_repair",
    "workspace:validate",
    "workspace:create_pr",
    "workspace:stop",
    // Admin permissions
    "deployment:approve_production",
    "deployment:merge_pr",
    "org:manage_members",
    "org:manage_integrations",
  ],
  owner: [
    // Full permissions
    "project:view",
    "incident:view",
    "workspace:view",
    "deployment:view",
    "org:view_audit_logs",
    "project:create",
    "project:update",
    "project:delete",
    "incident:diagnose",
    "incident:resolve",
    "workspace:create",
    "workspace:execute_command",
    "workspace:edit_code",
    "workspace:run_ai_repair",
    "workspace:validate",
    "workspace:create_pr",
    "workspace:stop",
    "deployment:approve_production",
    "deployment:merge_pr",
    "org:manage_members",
    "org:manage_integrations",
    "org:manage_billing",
    "org:delete",
  ],
};

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}
