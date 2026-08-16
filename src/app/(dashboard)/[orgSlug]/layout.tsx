import { MobileNav } from "@/components/layout/mobile-nav";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import React from "react";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar orgSlug={orgSlug} />
      <div className="flex flex-col flex-1 min-w-0 pb-16 md:pb-0">
        <Navbar orgSlug={orgSlug} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
      <MobileNav orgSlug={orgSlug} />
    </div>
  );
}
