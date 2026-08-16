import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, CheckCircle2, Cpu, Github, Key, Server, Shield, Sparkles } from "lucide-react";
import React from "react";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Organization Settings & Integrations</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage API keys, connected developer tools, and LLM gateway configurations.
        </p>
      </div>

      {/* GitHub App */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Github className="w-4 h-4 text-foreground" /> GitHub App Integration
            </CardTitle>
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="w-3 h-3" /> Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <p className="text-muted-foreground">
            GitHub App provides short-lived installation access tokens for repository inspection and automated repair PRs.
          </p>
          <div className="p-2.5 rounded bg-secondary/30 font-mono text-[11px] text-muted-foreground">
            App ID: 123456 | Permissions: Contents (Read), Pull Requests (Write)
          </div>
        </CardContent>
      </Card>

      {/* Vercel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Server className="w-4 h-4 text-foreground" /> Vercel Deployment & Sandboxes
            </CardTitle>
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="w-3 h-3" /> Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <p className="text-muted-foreground">
            Connects production deployment status and spins up @vercel/sandbox environments for isolated testing.
          </p>
          <div className="p-2.5 rounded bg-secondary/30 font-mono text-[11px] text-muted-foreground">
            Team: team_acme | Sandbox Execution: Enabled
          </div>
        </CardContent>
      </Card>

      {/* OpenRouter LLM */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" /> OpenRouter LLM Gateway
            </CardTitle>
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="w-3 h-3" /> Configured
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded bg-secondary/30">
              <span className="text-[10px] text-muted-foreground block">Analysis Model</span>
              <span className="font-mono text-foreground font-semibold">anthropic/claude-3.5-sonnet</span>
            </div>
            <div className="p-2.5 rounded bg-secondary/30">
              <span className="text-[10px] text-muted-foreground block">Coding Agent Model</span>
              <span className="font-mono text-foreground font-semibold">anthropic/claude-3.5-sonnet</span>
            </div>
            <div className="p-2.5 rounded bg-secondary/30">
              <span className="text-[10px] text-muted-foreground block">Review Model</span>
              <span className="font-mono text-foreground font-semibold">openai/gpt-4o</span>
            </div>
            <div className="p-2.5 rounded bg-secondary/30">
              <span className="text-[10px] text-muted-foreground block">Fast / Triage Model</span>
              <span className="font-mono text-foreground font-semibold">openai/gpt-4o-mini</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Memory (TencentDB Phase 2) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" /> Project Memory (TencentDB Agent Memory)
            </CardTitle>
            <Badge variant="outline">Phase 2 Ready</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <p className="text-muted-foreground">
            Scoped organization & project memory storing architecture context, coding conventions, and past bugfix patterns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
