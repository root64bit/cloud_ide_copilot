import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { OrganizationMemberRepo } from "@/lib/supabase/repositories";
import type { UserRole } from "@/lib/supabase/types";
import { hasPermission, type Permission } from "./permissions";

export interface SessionContext {
  userId: string;
  organizationId: string;
  role: UserRole;
}

export class AuthGuard {
  public static async assertPermission(
    userId: string | undefined | null,
    organizationId: string,
    requiredPermission: Permission
  ): Promise<SessionContext> {
    if (!userId) {
      throw new UnauthorizedError("Authentication required to access organization resources");
    }

    const member = await OrganizationMemberRepo.getMembership(organizationId, userId);
    if (!member) {
      throw new ForbiddenError("User is not a member of this organization");
    }

    const role = member.role as UserRole;
    if (!hasPermission(role, requiredPermission)) {
      throw new ForbiddenError(`Role '${role}' lacks required permission '${requiredPermission}'`);
    }

    return { userId, organizationId, role };
  }

  public static async assertProductionApproval(
    userId: string,
    organizationId: string
  ): Promise<SessionContext> {
    return this.assertPermission(userId, organizationId, "deployment:approve_production");
  }
}
