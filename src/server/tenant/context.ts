import "server-only";

import { getAuthenticatedUser, requireOrganizationBySlug } from "@/lib/supabase/auth";
import { OrganizationMemberRepo, OrganizationRepo } from "@/lib/supabase/repositories";

export async function getTenantPageContext(orgSlug: string) {
  const user = await getAuthenticatedUser();
  const tenant = await requireOrganizationBySlug(user.id, orgSlug);
  const organization = await OrganizationRepo.findById(tenant.organizationId);
  if (!organization) throw new Error("Organization disappeared after access resolution");
  return { user, tenant, organization };
}

export async function getUserOrganizations(userId: string) {
  const memberships = await OrganizationMemberRepo.listByUser(userId);
  const organizations = await OrganizationRepo.listByIds(memberships.map((m: any) => m.organization_id));
  const roleByOrg = new Map(memberships.map((m: any) => [m.organization_id, m.role]));
  return organizations.map((organization: any) => ({
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    role: roleByOrg.get(organization.id) || "viewer",
  }));
}
