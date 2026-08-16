import type { UserRole } from "@/lib/supabase/types";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 10,
  engineer: 20,
  admin: 30,
  owner: 40,
};

export function hasRoleAtLeast(userRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
}
