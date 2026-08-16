"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, Box, CheckCircle2, FolderGit2, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function MobileNav({ orgSlug = "acme-corp" }: { orgSlug?: string }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: `/${orgSlug}`, icon: LayoutDashboard },
    { name: "Projects", href: `/${orgSlug}/projects`, icon: FolderGit2 },
    { name: "Incidents", href: `/${orgSlug}/incidents`, icon: AlertTriangle, badge: "1" },
    { name: "Workspaces", href: `/${orgSlug}/workspaces`, icon: Box },
    { name: "Deploy", href: `/${orgSlug}/deployments`, icon: CheckCircle2 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-center justify-around h-14 px-2 shadow-lg">
      {navItems.map((item) => {
        const isActive =
          item.href === `/${orgSlug}`
            ? pathname === `/${orgSlug}`
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors relative",
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="w-4 h-4 mb-0.5" />
            <span>{item.name}</span>
            {item.badge && (
              <span className="absolute top-1 right-3 bg-destructive text-destructive-foreground text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
