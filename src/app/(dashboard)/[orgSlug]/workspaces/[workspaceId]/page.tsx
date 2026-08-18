"use client";

import { CopilotChatPanel } from "@/components/workspace/copilot-chat-panel";
import { FileExplorer } from "@/components/workspace/file-explorer";
import { PrApprovalView } from "@/components/workspace/pr-approval-view";
import { ValidationPipelineView } from "@/components/workspace/validation-pipeline-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TerminalOutput } from "@/components/ui/terminal-output";
import type { CommandType, WorkspaceStatus } from "@/lib/supabase/types";
import type { RepairPlan } from "@/server/providers/ai/ai.interface";
import type { ValidationPipelineResult } from "@/server/services/validation.service";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  ExternalLink,
  GitPullRequest,
  Sparkles,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function RepairWorkspacePage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const workspaceId = params.workspaceId as string;

  const [activeFile, setActiveFile] = useState("src/services/auth.service.ts");
  const [openFiles, setOpenFiles] = useState<string[]>([
    "src/services/auth.service.ts",
    "src/services/auth.service.test.ts",
  ]);
  const [centerView, setCenterView] = useState<"code" | "diff" | "pr" | "validation">("diff");
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(true);

  const [workspaceStatus, setWorkspaceStatus] = useState<WorkspaceStatus>("creating");
  const [terminalOutput, setTerminalOutput] = useState<string>(
    "OQVEN Sandbox loaded. Ready for interactive copilot prompts."
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
  const [attachedChips, setAttachedChips] = useState<string[]>(["@auth.service.ts"]);

  const [validationResult, setValidationResult] = useState<ValidationPipelineResult | null>(null);

  const [pullRequest, setPullRequest] = useState<{
    number: number;
    url: string;
    branch: string;
    status: string;
  } | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadWorkspace = async () => {
      try {
        const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Unable to load workspace");
        if (cancelled) return;

        setWorkspaceStatus(data.workspace.status);
        if (data.pullRequest) {
          setPullRequest({
            number: data.pullRequest.number,
            url: data.pullRequest.url,
            branch: data.pullRequest.branch,
            status: data.pullRequest.status,
          });
        }
        if (data.preview?.url) setPreviewUrl(data.preview.url);
        if (data.repairArtifact?.patchContent) setRepairDiff(data.repairArtifact.patchContent);
        const conversationUrl = data.repairArtifact?.stats?.conversationUrl;
        if (typeof conversationUrl === "string") setOpenHandsConversationUrl(conversationUrl);
        setTerminalOutput((prev) => `${prev}\n[Workspace] Status: ${data.workspace.status}\n[Sandbox] ${data.workspace.sandbox_id || "ephemeral container active"}`);
      } catch (loadError) {
        if (!cancelled) {
          const message = loadError instanceof Error ? loadError.message : "Unable to load workspace";
          setTerminalOutput((prev) => `${prev}\n[Workspace Error] ${message}`);
        }
      }
    };
    void loadWorkspace();
    return () => { cancelled = true; };
  }, [workspaceId]);

  // Resume production observation after a reload
  useEffect(() => {
    if (workspaceStatus !== "merged" || isApproving) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let lastObservation = "";

    const refreshProduction = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/production`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Unable to observe production deployment");
        if (cancelled || !data.observed) return;

        const observationKey = `${data.status || "unknown"}:${data.productionUrl || ""}`;
        if (observationKey !== lastObservation) {
          lastObservation = observationKey;
          setTerminalOutput((prev) => `${prev}\n[Vercel Production] ${data.status}: ${data.productionUrl || "URL unavailable"}`);
        }

        if (data.status === "ready") {
          setWorkspaceStatus("completed");
          if (intervalId) clearInterval(intervalId);
        } else if (data.status === "error" || data.status === "canceled") {
          if (intervalId) clearInterval(intervalId);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to observe production deployment";
          setTerminalOutput((prev) => `${prev}\n[Production Observation] ${message}`);
        }
      }
    };

    void refreshProduction();
    intervalId = setInterval(() => void refreshProduction(), 10_000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [workspaceId, workspaceStatus, isApproving]);

  // 1. Generate AI Repair Patch through Trigger.dev -> OpenHands Cloud run
  const handleGenerateRepair = async (customInstructions?: string, model?: string) => {
    setIsRepairing(true);
    setRepairDiff("");
    setOpenHandsConversationUrl(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/repair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructions: customInstructions || undefined,
          model: model || undefined,
        }),
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
      setTerminalOutput((prev) => `${prev}\n\n[Trigger.dev] Queued OpenHands repair task: ${data.runId}`);

      const deadline = Date.now() + 60 * 60 * 1000;
      let lastStatus = "";

      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const runRes = await fetch(`/api/trigger/runs/${encodeURIComponent(data.runId)}?workspaceId=${encodeURIComponent(workspaceId)}`, {
          cache: "no-store",
        });
        const runData = await runRes.json();
        if (!runRes.ok) {
          throw new Error(runData?.error || "Unable to retrieve Trigger.dev run");
        }

        const run = runData.run;
        if (run?.status && run.status !== lastStatus) {
          lastStatus = run.status;
          setTerminalOutput((prev) => `${prev}\n[OpenHands Worker] Status: ${run.status}`);
        }

        if (run?.status === "COMPLETED") {
          const syncRes = await fetch(`/api/workspaces/${workspaceId}/sync-repair`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          const syncData = await syncRes.json();
          if (!syncRes.ok) {
            throw new Error(syncData?.error || "Failed to synchronize OpenHands patch with Sandbox");
          }

          setRepairDiff(syncData.patchContent || "");
          if (syncData.conversationUrl) setOpenHandsConversationUrl(syncData.conversationUrl);
          setWorkspaceStatus(syncData.workspaceStatus || "ready_for_validation");
          setCenterView("diff");
          setTerminalOutput((prev) => `${prev}\n[OQVEN] Patch synced to Vercel Sandbox. Ready for deterministic validation.`);
          return;
        }

        if (run?.status === "FAILED" || run?.status === "CANCELED" || run?.status === "CRASHED") {
          throw new Error(`OpenHands repair run ended with status ${run.status}`);
        }
      }
      throw new Error("OpenHands repair timed out after 60 minutes");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to run OpenHands repair";
      setTerminalOutput((prev) => `${prev}\n[Repair Error] ${message}`);
    } finally {
      setIsRepairing(false);
    }
  };

  // 2. Execute Shell Command in Vercel Sandbox
  const handleExecuteCommand = async (command: string, type: CommandType = "test") => {
    setIsExecutingCommand(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to execute command in sandbox");
      const result = data.result;
      setTerminalOutput((prev) => `${prev}\n\n$ ${command}\n${result.stdout}${result.stderr ? `\n[STDERR]\n${result.stderr}` : ""}\n[Exit Code: ${result.exitCode}]`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Command execution failed";
      setTerminalOutput((prev) => `${prev}\n[Execution Error] ${message}`);
    } finally {
      setIsExecutingCommand(false);
    }
  };

  // 3. Run Deterministic Validation Pipeline
  const handleRunValidation = async () => {
    setIsValidating(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Validation pipeline failed");
      setValidationResult(data.validationResult);
      setWorkspaceStatus(data.validationResult.allPassed ? "ready_for_review" : "validation_failed");
      setCenterView("validation");
      setTerminalOutput((prev) => `${prev}\n\n[Validation Gate] Real sandbox validation completed. All passed: ${data.validationResult.allPassed}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Validation pipeline failed";
      setTerminalOutput((prev) => `${prev}\n[Validation Error] ${message}`);
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
          title: `fix: validated repair from OQVEN workspace ${workspaceId}`,
          description: "AI-assisted repair validated in an isolated Vercel Sandbox. Human production approval remains required.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Pull Request creation failed");
      setPullRequest({
        number: data.pullRequest.number,
        url: data.pullRequest.url,
        branch: data.pullRequest.branch,
        status: data.pullRequest.status,
      });
      setPreviewUrl(data.previewUrl || null);
      setWorkspaceStatus(data.previewStatus === "ready" ? "preview_ready" : data.previewStatus === "building" ? "preview_building" : "pr_created");
      setCenterView("pr");
      setTerminalOutput((prev) => `${prev}\n\n[Git Provider] Created PR #${data.pullRequest.number}. Preview status: ${data.previewStatus}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Pull Request creation failed";
      setTerminalOutput((prev) => `${prev}\n[PR Error] ${message}`);
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
        body: JSON.stringify({ approved: true, reason: notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Production approval/merge failed");
      setWorkspaceStatus("merged");
      setTerminalOutput((prev) => `${prev}\n\n[Production Gate] APPROVED & MERGED at ${data.result.mergeCommitSha || "unknown SHA"}. Waiting for exact Vercel production deployment evidence.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Production approval/merge failed";
      setTerminalOutput((prev) => `${prev}\n[Production Gate Error] ${message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleSelectFile = (path: string) => {
    setActiveFile(path);
    if (!openFiles.includes(path)) {
      setOpenFiles((prev) => [...prev, path]);
    }
    setCenterView("code");
  };

  const handleCloseFile = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = openFiles.filter((f) => f !== path);
    setOpenFiles(remaining);
    if (activeFile === path && remaining.length > 0) {
      setActiveFile(remaining[0]);
    }
  };

  const handleAddChip = (chip: string) => {
    if (!attachedChips.includes(chip)) {
      setAttachedChips((prev) => [...prev, chip]);
    }
  };

  const handleRemoveChip = (chip: string) => {
    setAttachedChips((prev) => prev.filter((c) => c !== chip));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#070A10] text-[#F8FAFC] overflow-hidden">
      {/* Top Workspace Toolbar */}
      <div className="h-12 border-b border-[#1E293B] bg-[#0B1018] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/${orgSlug}/workspaces`}
            className="text-xs text-[#64748B] hover:text-white flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Workspaces
          </Link>
          <div className="h-4 w-px bg-[#1E293B]" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-white">Workspace {workspaceId.slice(0, 8)}</span>
            <Badge variant={workspaceStatus === "completed" ? "success" : "secondary"} className="text-[10px] font-mono">
              {workspaceStatus}
            </Badge>
          </div>
        </div>

        {/* Action Gate Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={centerView === "diff" ? "primary" : "outline"}
            size="sm"
            onClick={() => setCenterView("diff")}
            className="h-7 text-xs gap-1"
          >
            <Code2 className="w-3.5 h-3.5" /> Diff & Changes
          </Button>

          <Button
            variant={centerView === "validation" ? "primary" : "outline"}
            size="sm"
            onClick={() => void handleRunValidation()}
            isLoading={isValidating}
            className="h-7 text-xs gap-1 border-[#22C55E]/40 text-[#22C55E]"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Validate Sandbox
          </Button>

          <Button
            variant={centerView === "pr" ? "primary" : "outline"}
            size="sm"
            onClick={() => setCenterView("pr")}
            className="h-7 text-xs gap-1 border-[#00E5FF]/40 text-[#00E5FF]"
          >
            <GitPullRequest className="w-3.5 h-3.5" /> Release Gate
          </Button>
        </div>
      </div>

      {/* 3-Pane Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Pane 1: File Explorer (Left) */}
        <FileExplorer
          activeFile={activeFile}
          onSelectFile={handleSelectFile}
          onAttachContext={(filename) => handleAddChip(`@${filename}`)}
        />

        {/* Pane 2: Center Editor & Terminal Area */}
        <main className="flex-1 flex flex-col bg-[#05070B] overflow-hidden relative border-r border-[#1E293B]">
          {/* File Tabs Header */}
          <div className="flex border-b border-[#1E293B] bg-[#090D16] h-9 overflow-x-auto shrink-0">
            {openFiles.map((filePath) => {
              const fileName = filePath.split("/").pop() || filePath;
              const isSelected = activeFile === filePath && centerView === "code";
              return (
                <div
                  key={filePath}
                  onClick={() => {
                    setActiveFile(filePath);
                    setCenterView("code");
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 border-r border-[#1E293B] text-xs cursor-pointer select-none transition-colors ${
                    isSelected
                      ? "bg-[#05070B] border-t-2 border-t-[#00E5FF] text-white font-medium"
                      : "bg-[#090D16] text-[#64748B] hover:text-[#CBD5E1]"
                  }`}
                >
                  <Code2 className="w-3 h-3 text-[#00E5FF]" />
                  <span className="font-mono">{fileName}</span>
                  <span
                    onClick={(e) => handleCloseFile(filePath, e)}
                    className="text-[#64748B] hover:text-[#EF4444] ml-1 p-0.5 rounded"
                  >
                    &times;
                  </span>
                </div>
              );
            })}

            {repairDiff && (
              <div
                onClick={() => setCenterView("diff")}
                className={`flex items-center gap-2 px-3 py-1.5 border-r border-[#1E293B] text-xs cursor-pointer select-none ${
                  centerView === "diff"
                    ? "bg-[#05070B] border-t-2 border-t-[#22C55E] text-[#22C55E] font-medium"
                    : "bg-[#090D16] text-[#64748B] hover:text-[#CBD5E1]"
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#22C55E]" />
                <span className="font-mono">AI Patch Diff</span>
              </div>
            )}
          </div>

          {/* Breadcrumbs */}
          <div className="h-7 px-4 border-b border-[#1E293B] bg-[#070A10] flex items-center text-[11px] font-mono text-[#64748B] gap-1 shrink-0">
            <span>workspace</span>
            <span>&gt;</span>
            <span className="text-[#CBD5E1]">{centerView === "diff" ? "repair-patch.diff" : activeFile}</span>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs">
            {centerView === "diff" && (
              <div className="space-y-4">
                {repairDiff ? (
                  <div className="rounded-lg border border-[#1E293B] bg-[#090D16] overflow-hidden">
                    <div className="p-3 border-b border-[#1E293B] bg-[#0B1018] flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" /> Generated Repair Patch
                      </span>
                      {openHandsConversationUrl && (
                        <a
                          href={openHandsConversationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#00E5FF] hover:underline flex items-center gap-1"
                        >
                          View OpenHands Session <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="p-4 bg-[#05070B] text-xs leading-relaxed whitespace-pre font-mono overflow-x-auto text-[#CBD5E1]">
                      {repairDiff}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-[#1E293B] p-8 text-center bg-[#0B1018]/50 text-xs">
                    <Sparkles className="w-8 h-8 text-[#00E5FF] mx-auto mb-3 animate-pulse" />
                    <h3 className="font-bold text-sm text-white mb-1">No patch generated yet</h3>
                    <p className="text-[#94A3B8] max-w-md mx-auto mb-4">
                      Type your repair prompt in the AI Copilot on the right or click below to trigger OpenHands.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => void handleGenerateRepair()}
                      isLoading={isRepairing}
                      className="bg-[#00E5FF] text-[#00363D] hover:bg-[#00E5FF]/90 font-bold"
                    >
                      Generate AI Repair
                    </Button>
                  </div>
                )}
              </div>
            )}

            {centerView === "code" && (
              <div className="rounded-lg border border-[#1E293B] bg-[#05070B] p-4 text-xs leading-relaxed whitespace-pre font-mono text-[#CBD5E1]">
                <div className="text-[#64748B] mb-2">// Viewing: {activeFile}</div>
                <div>{`import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../providers/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
  ) {}

  async refreshSession(token: string): Promise<Session> {
    const decoded = await this.jwt.verify(token);
    const sessionKey = \`session:\${decoded.id}\`;
    
    // Acquire distributed lock to prevent race condition during token refresh
    const lock = await this.redis.lock(\`lock:refresh:\${decoded.id}\`, 5000);
    if (!lock) throw new UnauthorizedException('Refresh already in progress');

    try {
      const session = await this.redis.get(sessionKey);
      if (!session) throw new UnauthorizedException('Session expired or invalid');
      return session;
    } finally {
      await lock.release();
    }
  }
}`}</div>
              </div>
            )}

            {centerView === "validation" && (
              <div className="space-y-4">
                {validationResult ? (
                  <ValidationPipelineView
                    workspaceStatus={workspaceStatus}
                    onRunValidation={() => void handleRunValidation()}
                    isRunning={isValidating}
                    result={validationResult}
                  />
                ) : (
                  <div className="rounded-lg border border-[#1E293B] p-8 text-center bg-[#0B1018]/50 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-[#22C55E] mx-auto mb-3" />
                    <h3 className="font-bold text-sm text-white mb-1">Deterministic Validation Gate</h3>
                    <p className="text-[#94A3B8] max-w-md mx-auto mb-4">
                      Run automated allowlisted test commands (`npm test`, `typecheck`, `build`) in the Vercel Sandbox.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => void handleRunValidation()}
                      isLoading={isValidating}
                      className="bg-[#22C55E] text-black hover:bg-[#22C55E]/90 font-bold"
                    >
                      Run Full Validation
                    </Button>
                  </div>
                )}
              </div>
            )}

            {centerView === "pr" && (
              <PrApprovalView
                workspaceStatus={workspaceStatus}
                pullRequest={pullRequest}
                previewUrl={previewUrl}
                onCreatePr={() => void handleCreatePr()}
                onApproveAndMerge={(notes) => void handleApproveAndMerge(notes)}
                isCreatingPr={isCreatingPr}
                isApproving={isApproving}
              />
            )}
          </div>

          {/* Bottom Collapsible Sandbox Terminal Drawer */}
          <div className="border-t border-[#1E293B] bg-[#0B1018] shrink-0">
            <div
              onClick={() => setIsTerminalExpanded(!isTerminalExpanded)}
              className="h-8 px-4 flex items-center justify-between text-xs cursor-pointer select-none bg-[#090D16] hover:bg-[#0B1018] text-[#94A3B8]"
            >
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <Terminal className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span className="font-semibold text-white">Sandbox Terminal & Logs</span>
              </div>
              <div className="flex items-center gap-2">
                {isTerminalExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </div>
            </div>

            {isTerminalExpanded && (
              <div className="p-3 bg-[#05070B] max-h-48 overflow-y-auto">
                <TerminalOutput
                  output={terminalOutput}
                  status={isExecutingCommand ? "running" : "passed"}
                />
              </div>
            )}
          </div>
        </main>

        {/* Pane 3: Interactive Copilot Chat (Right) */}
        <CopilotChatPanel
          isRepairing={isRepairing}
          workspaceStatus={workspaceStatus}
          onGenerateRepair={handleGenerateRepair}
          onRunValidation={handleRunValidation}
          onCreatePr={handleCreatePr}
          attachedChips={attachedChips}
          onAddChip={handleAddChip}
          onRemoveChip={handleRemoveChip}
        />
      </div>
    </div>
  );
}
