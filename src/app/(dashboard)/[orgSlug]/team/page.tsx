import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Shield, User, UserCheck } from "lucide-react";
import React from "react";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  const members = [
    {
      id: "mem_1",
      name: "Senior Architect",
      email: "architect@example.com",
      role: "owner",
      joinedAt: "Jan 15, 2026",
    },
    {
      id: "mem_2",
      name: "Security Lead",
      email: "security@example.com",
      role: "admin",
      joinedAt: "Jan 20, 2026",
    },
    {
      id: "mem_3",
      name: "Core Engineer",
      email: "engineer@example.com",
      role: "engineer",
      joinedAt: "Feb 1, 2026",
    },
    {
      id: "mem_4",
      name: "Product Viewer",
      email: "viewer@example.com",
      role: "viewer",
      joinedAt: "Feb 10, 2026",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Team Members & RBAC Roles</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Strict role-based access control with server-side authorization enforcement.
          </p>
        </div>

        <Button size="sm" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Invite Member
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Active Organization Members
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 divide-y divide-border/60">
          {members.map((m) => (
            <div key={m.id} className="p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground font-semibold">
                  {m.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{m.name}</h4>
                  <p className="text-[11px] text-muted-foreground">{m.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    m.role === "owner"
                      ? "default"
                      : m.role === "admin"
                      ? "warning"
                      : m.role === "engineer"
                      ? "success"
                      : "secondary"
                  }
                  className="font-mono text-[10px]"
                >
                  {m.role}
                </Badge>
                <span className="text-[11px] text-muted-foreground hidden sm:block">
                  Joined {m.joinedAt}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
