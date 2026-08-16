import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTimeAgo } from "@/lib/utils";
import { CheckCircle2, ExternalLink, GitBranch, Globe, Server, ShieldCheck } from "lucide-react";
import React from "react";

export default async function DeploymentsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  const deployments = [
    {
      id: "dpl_prod_1",
      projectName: "OneDealer",
      environment: "production",
      branch: "main",
      commitSha: "a9f82d1c5e4b",
      url: "https://onedealer.example.com",
      status: "ready",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "dpl_prev_1",
      projectName: "OneDealer",
      environment: "preview",
      branch: "ai-repair/onedealer-fix-discount-null",
      commitSha: "f1a2b3c4d5e6",
      url: "https://onedealer-preview-pr-101.vercel.app",
      status: "ready",
      createdAt: new Date(Date.now() - 180000).toISOString(),
    },
    {
      id: "dpl_prod_2",
      projectName: "YAKA",
      environment: "production",
      branch: "main",
      commitSha: "8b7a6c5d4e3f",
      url: "https://yaka.example.com",
      status: "ready",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Deployments & Environments</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Production releases and Vercel preview environments with human approval status.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {deployments.map((d) => (
          <Card key={d.id}>
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{d.projectName}</span>
                  <Badge variant={d.environment === "production" ? "default" : "secondary"}>
                    {d.environment}
                  </Badge>
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{formatTimeAgo(d.createdAt)}</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-primary" /> {d.branch}
                  </span>
                  <span>Commit: {d.commitSha}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Visit URL</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
