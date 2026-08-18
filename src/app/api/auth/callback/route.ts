import { OrganizationMemberRepo, OrganizationRepo } from "@/lib/supabase/repositories";
import { createServerAuthClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    try {
      const supabase = await createServerAuthClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.user) {
        const memberships = await OrganizationMemberRepo.listByUser(data.user.id);
        if (memberships.length > 0) {
          const org = await OrganizationRepo.findById(memberships[0].organization_id);
          if (org) {
            return NextResponse.redirect(new URL(`/${org.slug}`, requestUrl.origin));
          }
        }
        return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
      }
    } catch (err) {
      console.error("[Auth Callback Error]", err);
    }
  }

  // Redirect to login if code is missing or exchange fails
  return NextResponse.redirect(new URL("/login?error=Confirmation+link+expired+or+already+used", requestUrl.origin));
}
