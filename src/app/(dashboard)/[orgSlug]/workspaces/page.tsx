import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTimeAgo } from "@/lib/utils";
import { ArrowRight, Box, Clock, GitBranch, Plus } from "lucide-react";
import Link from "next/link";
import React from "react";

export default async function WorkspacesListPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  const mockWorkspaces = [
    {
      id: "ws_onedealer_repair_1",
      name: "ws-onedealer-fix-9284",
      projectName: "OneDealer",
      projectSlug: "onedealer",
      repairBranch: "ai-repair/onedealer-fix-discount-null",
      baseCommitSha: "a9f82d1c5e4b7890123456789abcdef012345678",
      status: "ready",
      lastActivity: new Date(Date.now() - 120000).toISOString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Repair Workspaces</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Isolated execution sandboxes running @vercel/sandbox with automated validation gates.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {mockWorkspaces.map((ws) => (
          <Card key={ws.id} className="hover:border-primary/40 transition-colors">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default" className="font-mono text-[10px]">
                    {ws.projectName}
                  </Badge>
                  <Badge variant="success">● {ws.status}</Badge>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatTimeAgo(ws.lastActivity)}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-foreground">{ws.name}</h4>

                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-primary" /> {ws.repairBranch}
                  </span>
                  <span>Base: {ws.baseCommitSha.slice(0, 7)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/${orgSlug}/workspaces/${ws.id}`}>
                  <Button size="sm" className="gap-1.5">
                    Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
