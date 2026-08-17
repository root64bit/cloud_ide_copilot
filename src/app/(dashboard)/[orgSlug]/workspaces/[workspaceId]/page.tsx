"use client";

import { PrApprovalView } from "@/components/workspace/pr-approval-view";
import { ValidationPipelineView } from "@/components/workspace/validation-pipeline-view";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DiffViewer } from "@/components/ui/diff-viewer";
import { Tabs } from "@/components/ui/tabs";
import { TerminalOutput } from "@/components/ui/terminal-output";
import type { CommandType, WorkspaceStatus } from "@/lib/supabase/types";
import type { RepairPlan } from "@/server/providers/ai/ai.interface";
import type { ValidationPipelineResult } from "@/server/services/validation.service";
import {
  ArrowLeft,
  Bot,
  Box,
  CheckCircle2,
  Code2,
  ExternalLink,
  GitBranch,
  GitPullRequest,
  Lock,
  Play,
  ShieldAlert,
  Sparkles,
  StopCircle,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useState } from "react";

export default function RepairWorkspacePage() {
  const params = useParams();
  const orgSlug = (params.orgSlug as string) || "acme-corp";
  const workspaceId = (params.workspaceId as string) || "ws_onedealer_repair_1";

  const [activeTab, setActiveTab] = useState("diff");
  const [workspaceStatus, setWorkspaceStatus] = useState<WorkspaceStatus>("ready");
  const [terminalOutput, setTerminalOutput] = useState<string>(
    "Workspace loaded. Run a real provider action to begin."
  );
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [repairPlan, setRepairPlan] = useState<RepairPlan | null>(null);
  const [repairDiff, setRepairDiff] = useState<string>("");
  const [openHandsConversationUrl, setOpenHandsConversationUrl] = useState<string | null>(null);
  const [triggerRunId, setTriggerRunId] = useState<string | null>(null);

  const [validationResult, setValidationResult] = useState<ValidationPipelineResult | null>(null);

  const [pullRequest, setPullRequest] = useState<{
    number: number;
    url: string;
    branch: string;
    status: string;
  } | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 1. Generate AI Repair Patch through a real Trigger.dev -> OpenHands Cloud run
  const handleGenerateRepair = async () => {
    setIsRepairing(true);
    setRepairDiff("");
    setOpenHandsConversationUrl(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/repair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: "00000000-0000-0000-0000-000000000001" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Unable to queue OpenHands repair");
      }

      if (!data.runId) {
        throw new Error("Repair route did not return a Trigger.dev run ID");
      }

      setTriggerRunId(data.runId);
      setWorkspaceStatus("repairing");
      setTerminalOutput((prev) => `${prev}

[Trigger.dev] Queued OpenHands repair: ${data.runId}`);

      const deadline = Date.now() + 60 * 60 * 1000;
      let lastStatus = "";

      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const runRes = await fetch(`/api/trigger/runs/${encodeURIComponent(data.runId)}`, {
          cache: "no-store",
        });
        const runData = await runRes.json();
        if (!runRes.ok) {
          throw new Error(runData?.error || "Unable to retrieve Trigger.dev run");
        }

        const run = runData.run;
        if (run?.status && run.status !== lastStatus) {
          lastStatus = run.status;
          setTerminalOutput((prev) => `${prev}
[Trigger.dev] ${data.runId}: ${run.status}`);
        }

        if (!run?.completed) continue;
        if (!run.isSuccess) {
          throw new Error(run.error || `OpenHands repair task ended with status ${run.status}`);
        }

        const result = run.output;
        if (!result) throw new Error("Trigger.dev run completed without OpenHands output");

        setRepairPlan(result.repairPlan || null);
        setRepairDiff(result.diff || "");
        setOpenHandsConversationUrl(result.conversationUrl || null);
        setTerminalOutput((prev) =>
          `${prev}
[OpenHands] Real Cloud conversation completed: ${result.conversationId || "unknown"}
[OpenHands] Modified files: ${(result.modifiedFiles || []).join(", ") || "none"}`
        );
        return;
      }

      throw new Error("Timed out waiting for Trigger.dev/OpenHands repair completion");
    } catch (err) {
      const message = err instanceof Error ? err.message : "OpenHands repair failed";
      setTerminalOutput((prev) => `${prev}

[Repair Error] ${message}`);
    } finally {
      setIsRepairing(false);
    }
  };

  // 2. Execute Allowlisted Command in Sandbox
  const handleRunCommand = async (cmdType: CommandType) => {
    setIsExecutingCommand(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandType: cmdType,
          organizationId: "00000000-0000-0000-0000-000000000001",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTerminalOutput((prev) => `${prev}\n\n$ ${data.commandRun.command_display}\n${data.commandRun.stdout_excerpt || data.commandRun.stderr_excerpt}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExecutingCommand(false);
    }
  };

  // 3. Run Automated Validation Pipeline
  const handleRunValidation = async () => {
    setIsValidating(true);
    setWorkspaceStatus("validating");
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: "00000000-0000-0000-0000-000000000001" }),
      });
      if (res.ok) {
        const data = await res.json();
        setValidationResult(data.validationResult);
        setWorkspaceStatus(data.validationResult.allPassed ? "ready_for_review" : "validation_failed");
        setTerminalOutput((prev) => `${prev}\n\n[Validation Gate] Validation pipeline completed. All passed: ${data.validationResult.allPassed}`);
      }
    } catch (err) {
      console.error(err);
      setWorkspaceStatus("validation_failed");
    } finally {
      setIsValidating(false);
    }
  };

  // 4. Create Pull Request & Vercel Preview
  const handleCreatePr = async () => {
    setIsCreatingPr(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/pr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: "00000000-0000-0000-0000-000000000001",
          title: "fix(checkout): safely handle optional discountCode object",
          description: "Defensive check added in calculateTotal with regression test.",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPullRequest({
          number: data.result.pullRequest.number,
          url: data.result.pullRequest.url,
          branch: data.result.pullRequest.branch,
          status: data.result.pullRequest.status,
        });
        setPreviewUrl(data.result.previewUrl);
        setWorkspaceStatus("preview_ready");
        setTerminalOutput((prev) => `${prev}\n\n[Git Provider] Created PR #${data.result.pullRequest.number} and Vercel Preview: ${data.result.previewUrl}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingPr(false);
    }
  };

  // 5. Human Production Approval Gate
  const handleApproveAndMerge = async (notes: string) => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: "00000000-0000-0000-0000-000000000001",
          userId: "user_owner",
          approvalNotes: notes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaceStatus("completed");
        setTerminalOutput((prev) => `${prev}\n\n[Production Gate] APPROVED & MERGED to production. Deployment live at: ${data.result.productionUrl}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsApproving(false);
    }
  };

  const tabs = [
    { id: "diff", label: "AI Repair & Diff", icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: "terminal", label: "Sandbox Terminal", icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: "validation", label: "Validation Pipeline", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { id: "pr", label: "Pull Request & Production Gate", icon: <GitPullRequest className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <Link
          href={`/${orgSlug}/workspaces`}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspaces
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="default" className="font-mono">Repair Workspace</Badge>
              <Badge variant={workspaceStatus === "completed" ? "success" : "secondary"}>
                Status: {workspaceStatus}
              </Badge>
              <span className="text-[11px] text-muted-foreground font-mono">
                Agent workspace: changes remain uncommitted until deterministic validation is wired
              </span>
              {triggerRunId ? (
                <span className="text-[11px] text-muted-foreground font-mono">
                  Trigger: {triggerRunId}
                </span>
              ) : null}
            </div>
            <h2 className="text-lg font-bold tracking-tight mt-1">
              Workspace {workspaceId}
            </h2>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateRepair}
              isLoading={isRepairing}
              disabled={isRepairing || workspaceStatus === "completed"}
              className="gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Generate AI Fix
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled
              title="code-server is not connected to a real Vercel Sandbox workspace yet"
              className="gap-1.5"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Browser IDE — not wired</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === "diff" && (
        <div className="space-y-4">
          {repairPlan ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-foreground">
                    {repairPlan.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{repairPlan.description}</p>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  {repairPlan.filesToModify.map((mod, idx) => (
                    <DiffViewer
                      key={idx}
                      filePath={mod.filePath}
                      originalCode={mod.originalSnippet}
                      modifiedCode={mod.replacementSnippet}
                      diffSummary={mod.description}
                    />
                  ))}

                  {repairPlan.testFilesToCreateOrUpdate.map((testFile, idx) => (
                    <DiffViewer
                      key={idx}
                      filePath={testFile.filePath}
                      modifiedCode={testFile.testCode}
                      diffSummary="Automated Regression Unit Test"
                    />
                  ))}

                  {repairDiff ? (
                    <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
                      <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">OpenHands unified diff</span>
                        {openHandsConversationUrl ? (
                          <a
                            href={openHandsConversationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Open conversation <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : null}
                      </div>
                      <pre className="p-3 overflow-x-auto text-[11px] leading-5 font-mono whitespace-pre">{repairDiff}</pre>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-xs text-muted-foreground">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No repair plan proposed yet. Click &quot;Generate AI Fix&quot; above.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "terminal" && (
        <div className="space-y-3">
          <Alert variant="warning" title="Real Vercel Sandbox is not wired yet">
            Command execution is disabled so the platform cannot fabricate test/build output. The next phase must implement real @vercel/sandbox execution.
          </Alert>
          <div className="flex items-center gap-2 flex-wrap pb-2">
            <span className="text-xs font-semibold text-muted-foreground">Execute Allowed Command:</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRunCommand("test")}
              disabled
            >
              npm test
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRunCommand("lint")}
              disabled
            >
              npm run lint
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRunCommand("typecheck")}
              disabled
            >
              tsc --noEmit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRunCommand("build")}
              disabled
            >
              npm run build
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRunCommand("git_status")}
              disabled
            >
              git status
            </Button>
          </div>

          <TerminalOutput output={terminalOutput} />
        </div>
      )}

      {activeTab === "validation" && (
        <ValidationPipelineView
          workspaceStatus={workspaceStatus}
          onRunValidation={handleRunValidation}
          isRunning={isValidating}
          result={validationResult}
          blockedReason="Deterministic validation is intentionally blocked until real @vercel/sandbox install/test/lint/typecheck/build execution is available."
        />
      )}

      {activeTab === "pr" && (
        <PrApprovalView
          workspaceStatus={workspaceStatus}
          pullRequest={pullRequest}
          previewUrl={previewUrl}
          onCreatePr={handleCreatePr}
          onApproveAndMerge={handleApproveAndMerge}
          isCreatingPr={isCreatingPr}
          isApproving={isApproving}
          blockedReason="PR creation and production merge are intentionally blocked until OpenHands changes are validated in a real sandbox and pushed with the real GitHub App workflow."
        />
      )}
    </div>
  );
}
