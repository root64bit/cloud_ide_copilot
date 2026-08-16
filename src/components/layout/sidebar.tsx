"use client";

import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  Bot,
  Box,
  CheckCircle2,
  FolderGit2,
  History,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { OrgSwitcher } from "./org-switcher";

export function Sidebar({ orgSlug = "acme-corp" }: { orgSlug?: string }) {
  const pathname = usePathname();

  const navigation = [
    { name: "Overview", href: `/${orgSlug}`, icon: LayoutDashboard },
    { name: "Projects", href: `/${orgSlug}/projects`, icon: FolderGit2 },
    { name: "Incidents", href: `/${orgSlug}/incidents`, icon: AlertTriangle, badge: "1" },
    { name: "Workspaces", href: `/${orgSlug}/workspaces`, icon: Box },
    { name: "Deployments", href: `/${orgSlug}/deployments`, icon: CheckCircle2 },
    { name: "Team & RBAC", href: `/${orgSlug}/team`, icon: Users },
    { name: "Audit Trail", href: `/${orgSlug}/audit`, icon: History },
    { name: "Settings", href: `/${orgSlug}/settings`, icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/60 shrink-0 h-screen sticky top-0">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
            AI
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">AI Copilot</h1>
            <p className="text-[10px] text-muted-foreground">Engineering Platform</p>
          </div>
        </div>
        <OrgSwitcher currentOrgSlug={orgSlug} />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            item.href === `/${orgSlug}`
              ? pathname === `/${orgSlug}`
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="bg-destructive/20 text-destructive text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/80 bg-card/40">
        <div className="rounded-lg border border-border/60 p-2.5 bg-secondary/30">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sandbox Gateway
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Isolated execution active (Vercel Sandbox)
          </p>
        </div>
      </div>
    </aside>
  );
}
