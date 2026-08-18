import { UnauthorizedError } from "@/lib/errors";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { OrganizationMemberRepo, OrganizationRepo } from "@/lib/supabase/repositories";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  try {
    const user = await getAuthenticatedUser();
    const memberships = await OrganizationMemberRepo.listByUser(user.id);
    if (!memberships.length) redirect("/onboarding");
    const organization = await OrganizationRepo.findById(memberships[0].organization_id);
    if (!organization) redirect("/onboarding");
    redirect(`/${organization.slug}`);
  } catch (error) {
    if (error instanceof UnauthorizedError || (error as any)?.statusCode === 401) redirect("/login");
    throw error;
  }
}
