import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { InMemoryDatabase } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";
import { hasPermission, type Permission } from "./permissions";

export interface SessionContext {
  userId: string;
  organizationId: string;
  role: UserRole;
}

export class AuthGuard {
  /**
   * Resolves member session within the context of an organization and enforces RBAC permission.
   */
  public static async assertPermission(
    userId: string | undefined | null,
    organizationId: string,
    requiredPermission: Permission
  ): Promise<SessionContext> {
    if (!userId) {
      throw new UnauthorizedError("Authentication required to access organization resources");
    }

    // Look up membership
    const memberKey = `${organizationId}:${userId}`;
    const member = InMemoryDatabase.getInstance().members.get(memberKey);

    if (!member) {
      throw new ForbiddenError("User is not a member of this organization");
    }

    const role = member.role as UserRole;
    if (!hasPermission(role, requiredPermission)) {
      throw new ForbiddenError(
        `Role '${role}' lacks required permission '${requiredPermission}'`
      );
    }

    return {
      userId,
      organizationId,
      role,
    };
  }

  /**
   * Specifically validates production approval authorization (requires admin or owner).
   */
  public static async assertProductionApproval(
    userId: string,
    organizationId: string
  ): Promise<SessionContext> {
    return this.assertPermission(userId, organizationId, "deployment:approve_production");
  }
}
