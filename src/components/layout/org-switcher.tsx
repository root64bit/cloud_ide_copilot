"use client";

import { Building2, ChevronDown } from "lucide-react";
import React, { useState } from "react";

export interface OrgSwitcherOrganization {
  id: string;
  name: string;
  slug: string;
  role?: string;
}

export function OrgSwitcher({
  currentOrgSlug,
  organizations,
}: {
  currentOrgSlug: string;
  organizations: OrgSwitcherOrganization[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const currentOrg = organizations.find((organization) => organization.slug === currentOrgSlug);

  if (!currentOrg) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-md border border-border/80 bg-card hover:bg-secondary text-xs text-foreground font-medium transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{currentOrg.name}</span>
        </div>
        <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full rounded-md border border-border bg-card p-1 shadow-lg z-20" role="menu">
          {organizations.map((organization) => (
            <a
              key={organization.id}
              href={`/${organization.slug}`}
              className="block px-2.5 py-1.5 rounded text-xs text-foreground hover:bg-secondary transition-colors"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <span className="block truncate">{organization.name}</span>
              {organization.role ? (
                <span className="block text-[10px] text-muted-foreground mt-0.5">{organization.role}</span>
              ) : null}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
