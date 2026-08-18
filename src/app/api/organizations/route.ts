import { getAuthenticatedUser, requireOrganizationMembership } from "@/lib/supabase/auth";
import { OrganizationMemberRepo, OrganizationRepo } from "@/lib/supabase/repositories";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizeSlug(value: string): string {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  if (!/^[a-z0-9][a-z0-9-]{1,47}$/.test(slug)) throw new Error("Organization slug must contain letters, numbers, and dashes");
  return slug;
}

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const slug = new URL(req.url).searchParams.get("slug");

    if (slug) {
      const organization = await OrganizationRepo.findBySlug(slug);
      if (!organization) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
      const tenant = await requireOrganizationMembership(user.id, organization.id);
      return NextResponse.json({ organization, role: tenant.role });
    }

    const memberships = await OrganizationMemberRepo.listByUser(user.id);
    const organizations = await OrganizationRepo.listByIds(memberships.map((membership: any) => membership.organization_id));
    return NextResponse.json({
      organizations: organizations.map((organization: any) => ({
        ...organization,
        role: memberships.find((membership: any) => membership.organization_id === organization.id)?.role || "viewer",
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load organizations" }, { status: error?.statusCode || 500 });
  }
}

export async function POST(req: Request) {
  let createdOrgId: string | null = null;
  try {
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 100);
    if (name.length < 2) return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    const slug = normalizeSlug(String(body.slug || name));
    if (await OrganizationRepo.findBySlug(slug)) {
      return NextResponse.json({ error: "Organization slug is already in use" }, { status: 409 });
    }

    const organization = await OrganizationRepo.create({ name, slug, created_by: user.id });
    createdOrgId = organization.id;
    await OrganizationMemberRepo.create({ organization_id: organization.id, user_id: user.id, role: "owner" });
    return NextResponse.json({ organization }, { status: 201 });
  } catch (error: any) {
    if (createdOrgId) await OrganizationRepo.deleteById(createdOrgId).catch(() => undefined);
    return NextResponse.json({ error: error?.message || "Failed to create organization" }, { status: error?.statusCode || 500 });
  }
}
