import { MobileNav } from "@/components/layout/mobile-nav";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { UnauthorizedError } from "@/lib/errors";
import { getAuthenticatedUser, requireOrganizationBySlug } from "@/lib/supabase/auth";
import { getUserOrganizations } from "@/server/tenant/context";
import { redirect } from "next/navigation";
import React from "react";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  try {
    const user = await getAuthenticatedUser();
    const tenant = await requireOrganizationBySlug(user.id, orgSlug);
    const organizations = await getUserOrganizations(user.id);

    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar orgSlug={orgSlug} organizations={organizations} />
        <div className="flex flex-col flex-1 min-w-0 pb-16 md:pb-0">
          <Navbar orgSlug={orgSlug} userLabel={user.email || user.id} role={tenant.role} />
          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
        </div>
        <MobileNav orgSlug={orgSlug} />
      </div>
    );
  } catch (error) {
    if (error instanceof UnauthorizedError || (error as any)?.statusCode === 401) redirect("/login");
    throw error;
  }
}
