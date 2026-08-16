import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InMemoryDatabase } from "@/lib/supabase/server";
import { ArrowRight, FolderGit2, GitBranch, Plus, Server } from "lucide-react";
import Link from "next/link";
import React from "react";

export default async function ProjectsListPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const projects = Array.from(InMemoryDatabase.getInstance().projects.values());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Connected Projects</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Repositories connected via GitHub App with automated testing & Vercel deployment.
          </p>
        </div>

        <Link href={`/${orgSlug}/projects/new`}>
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Connect New Project
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((proj) => (
          <Card key={proj.id} className="hover:border-primary/40 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-bold">{proj.name}</CardTitle>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {proj.repository_owner}/{proj.repository_name}
                  </Badge>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-4 text-xs">
              <p className="text-muted-foreground">{proj.description}</p>

              <div className="bg-secondary/40 p-2.5 rounded-md border border-border/50 font-mono text-[11px] space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Install:</span>
                  <span className="text-foreground">{proj.install_command}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Test:</span>
                  <span className="text-foreground">{proj.test_command}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Build:</span>
                  <span className="text-foreground">{proj.build_command}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Server className="w-3 h-3" /> Vercel Production
                </span>
                <Link
                  href={`/${orgSlug}/projects/${proj.slug}`}
                  className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                >
                  Manage Console <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
