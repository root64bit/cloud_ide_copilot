"use client";

import { Building2, ChevronDown } from "lucide-react";
import React, { useState } from "react";

export function OrgSwitcher({ currentOrgSlug }: { currentOrgSlug: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const orgs = [
    { name: "Acme Engineering", slug: "acme-corp" },
    { name: "OneDealer Global", slug: "onedealer-org" },
    { name: "Personal Sandbox", slug: "personal" },
  ];

  const currentOrg = orgs.find((o) => o.slug === currentOrgSlug) || orgs[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-md border border-border/80 bg-card hover:bg-secondary text-xs text-foreground font-medium transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{currentOrg.name}</span>
        </div>
        <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full rounded-md border border-border bg-card p-1 shadow-lg z-20">
          {orgs.map((org) => (
            <a
              key={org.slug}
              href={`/${org.slug}`}
              className="block px-2.5 py-1.5 rounded text-xs text-foreground hover:bg-secondary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {org.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
