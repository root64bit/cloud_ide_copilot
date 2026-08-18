"use client";

import { ShieldCheck, User } from "lucide-react";
import React from "react";
import { Badge } from "../ui/badge";

export function Navbar({
  orgSlug,
  userLabel,
  role,
}: {
  orgSlug: string;
  userLabel: string;
  role: string;
}) {
  return (
    <header className="h-14 border-b border-border bg-card/40 backdrop-blur-xs flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
          Org: <span className="text-foreground">{orgSlug}</span>
        </span>
        <Badge variant="success" className="gap-1 text-[10px] hidden sm:inline-flex">
          <ShieldCheck className="w-3 h-3" /> Human Release Gate
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-md border border-border/50 max-w-[50%]">
        <User className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="font-medium text-foreground truncate">{userLabel}</span>
        <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono shrink-0">
          {role}
        </Badge>
      </div>
    </header>
  );
}
