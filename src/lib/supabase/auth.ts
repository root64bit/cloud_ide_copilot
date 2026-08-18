import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/lib/errors";
import { OrganizationMemberRepo, OrganizationRepo, WorkspaceRepo } from "./repositories";
import { createAdminClient, createServerAuthClient } from "./server";
import type { UserRole } from "./types";

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export interface TenantContext {
  userId: string;
  organizationId: string;
  orgSlug: string;
  role: UserRole;
}

function canUseExplicitDevIdentity(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_AUTH === "true";
}

/**
 * Resolves a real Supabase Auth user. No production fallback identity exists.
 * Bearer tokens are verified with Supabase Auth; cookie sessions use the SSR client.
 */
export async function getAuthenticatedUser(request?: Request): Promise<AuthenticatedUser> {
  const authHeader = request?.headers.get("authorization");
  const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  if (bearer) {
    if (process.env.NODE_ENV === "test" && bearer.startsWith("test_user_")) {
      return { id: bearer, email: `${bearer}@example.com` };
    }

    const { data, error } = await createAdminClient().auth.getUser(bearer);
    if (error || !data.user) {
      throw new UnauthorizedError("Invalid or expired Supabase access token");
    }
    return { id: data.user.id, email: data.user.email || undefined };
  }

  try {
    const supabase = await createServerAuthClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) {
      return { id: data.user.id, email: data.user.email || undefined };
    }
  } catch (error) {
    if (!canUseExplicitDevIdentity()) throw error;
  }

  if (canUseExplicitDevIdentity() && process.env.DEV_USER_ID) {
    return {
      id: process.env.DEV_USER_ID,
      email: process.env.DEV_USER_EMAIL || "developer@localhost",
    };
  }

  throw new UnauthorizedError("Authentication required");
}

export async function requireOrganizationMembership(
  userId: string,
  organizationId: string
): Promise<TenantContext> {
  const org = await OrganizationRepo.findById(organizationId);
  if (!org) throw new NotFoundError("Organization", organizationId);

  const membership = await OrganizationMemberRepo.getMembership(organizationId, userId);
  if (!membership) {
    throw new ForbiddenError("You do not have access to this organization");
  }

  return {
    userId,
    organizationId: org.id,
    orgSlug: org.slug,
    role: membership.role,
  };
}

export async function requireOrganizationBySlug(
  userId: string,
  orgSlug: string
): Promise<TenantContext> {
  const org = await OrganizationRepo.findBySlug(orgSlug);
  if (!org) throw new NotFoundError("Organization", orgSlug);
  return requireOrganizationMembership(userId, org.id);
}

export async function assertTenantAccess(
  request: Request,
  organizationId: string
): Promise<TenantContext> {
  const user = await getAuthenticatedUser(request);
  return requireOrganizationMembership(user.id, organizationId);
}

/** Resolve workspace ownership before accepting any tenant identifier from the client. */
export async function resolveWorkspaceTenant(
  request: Request,
  workspaceId: string
): Promise<{ user: AuthenticatedUser; tenant: TenantContext; workspace: any }> {
  const user = await getAuthenticatedUser(request);
  const workspace = await WorkspaceRepo.findByIdAny(workspaceId);
  if (!workspace) throw new NotFoundError("Workspace", workspaceId);
  const tenant = await requireOrganizationMembership(user.id, workspace.organization_id);
  return { user, tenant, workspace };
}
