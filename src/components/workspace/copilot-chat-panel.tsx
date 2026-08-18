"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowUp,
  Bot,
  CheckCircle2,
  ChevronDown,
  Code2,
  FileCode,
  Paperclip,
  Play,
  RotateCw,
  Search,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import React, { useState } from "react";

export interface CopilotMessage {
  id: string;
  sender: "user" | "copilot" | "system";
  text: string;
  timestamp: string;
  contextChips?: string[];
  taskStatus?: "running" | "completed" | "failed";
  actionDiff?: {
    file: string;
    additions: number;
    deletions: number;
  };
}

export function CopilotChatPanel({
  isRepairing,
  workspaceStatus,
  onGenerateRepair,
  onRunValidation,
  onCreatePr,
  attachedChips,
  onRemoveChip,
  onAddChip,
}: {
  isRepairing: boolean;
  workspaceStatus: string;
  onGenerateRepair: (instructions?: string) => Promise<void>;
  onRunValidation: () => Promise<void>;
  onCreatePr: () => Promise<void>;
  attachedChips: string[];
  onRemoveChip: (chip: string) => void;
  onAddChip: (chip: string) => void;
}) {
  const [promptInput, setPromptInput] = useState("");
  const [agentMode, setAgentMode] = useState<"agent" | "diagnostic" | "patch">("agent");
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "1",
      sender: "system",
      text: "OQVEN Copilot connected. Attached to Vercel Sandbox & OpenHands Cloud engine.",
      timestamp: "Just now",
    },
    {
      id: "2",
      sender: "copilot",
      text: "I am analyzing the workspace repository. Type a prompt below or click any quick action to generate a verified repair.",
      timestamp: "Just now",
      contextChips: ["@auth.service.ts"],
    },
  ]);

  const handleSendPrompt = async () => {
    if (!promptInput.trim() || isRepairing) return;
    const userText = promptInput.trim();
    setPromptInput("");

    const newMsg: CopilotMessage = {
      id: String(Date.now()),
      sender: "user",
      text: userText,
      timestamp: "Just now",
      contextChips: [...attachedChips],
    };

    setMessages((prev) => [...prev, newMsg]);

    try {
      await onGenerateRepair(userText);
      const copilotResponse: CopilotMessage = {
        id: String(Date.now() + 1),
        sender: "copilot",
        text: `Queued task with prompt: "${userText}". OpenHands is generating an isolated patch in Vercel Sandbox.`,
        timestamp: "Just now",
        taskStatus: "running",
        actionDiff: {
          file: attachedChips[0]?.replace("@", "") || "codebase",
          additions: 12,
          deletions: 4,
        },
      };
      setMessages((prev) => [...prev, copilotResponse]);
    } catch {
      const errorMsg: CopilotMessage = {
        id: String(Date.now() + 2),
        sender: "system",
        text: "Failed to queue task with provider. Please check Trigger.dev / OpenHands configuration.",
        timestamp: "Just now",
        taskStatus: "failed",
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSendPrompt();
    }
  };

  return (
    <aside className="w-[400px] lg:w-[460px] border-l border-[#1E293B] glass-panel flex flex-col shrink-0 h-full shadow-[-8px_0_24px_rgba(0,0,0,0.5)]">
      {/* Copilot Header */}
      <div className="p-3.5 border-b border-[#1E293B] bg-[#0B1018]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-[#00E5FF]" />
          </div>
          <div>
            <h2 className="font-bold text-xs text-white flex items-center gap-1.5 font-mono">
              OQVEN Copilot
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#00E5FF]/20 text-[#00E5FF] uppercase">
                AI Agent
              </span>
            </h2>
            <p className="text-[11px] text-[#64748B] flex items-center gap-1">
              <span className="pulse-dot mr-0.5" />
              OpenHands Cloud &bull; Claude 3.7 / DeepSeek
            </p>
          </div>
        </div>

        <Badge variant={isRepairing ? "warning" : "outline"} className="text-[10px] font-mono">
          {isRepairing ? "Executing" : workspaceStatus}
        </Badge>
      </div>

      {/* Task & Activity Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Active Task Card */}
        <div className="glass-inner rounded-xl p-3.5 border-l-2 border-l-[#00E5FF] relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1 font-mono text-[10px] text-[#00E5FF]">
                <span className="bg-[#00E5FF]/10 px-1.5 py-0.5 rounded border border-[#00E5FF]/20">
                  ACTIVE PIPELINE
                </span>
              </div>
              <h3 className="text-xs font-semibold text-white">
                Deterministic Repair & Sandbox Validation
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#F59E0B] flex items-center gap-1">
              {isRepairing ? (
                <>
                  <RotateCw className="w-3 h-3 animate-spin" /> In Progress
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-[#22C55E]" /> Ready
                </>
              )}
            </span>
          </div>

          {/* Checklist progress */}
          <div className="space-y-1.5 pt-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              <span className="line-through opacity-70">Sandbox container isolated</span>
            </div>
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              <span className="line-through opacity-70">Git repository cloned</span>
            </div>
            <div className="flex items-center gap-2 text-white bg-[#090D16] p-1.5 rounded border border-[#1E293B]">
              <span className="pulse-dot ml-0.5" />
              <span>Prompt instructions ready to execute</span>
            </div>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="space-y-2 border-l border-[#1E293B] pl-3 ml-2 font-mono text-[11px]">
          <div className="flex items-center gap-2 text-[#64748B]">
            <Search className="w-3 h-3 text-[#00E5FF]" />
            <span>Scanning project AST and dependencies</span>
          </div>
          <div className="flex items-center gap-2 text-[#94A3B8] bg-[#00E5FF]/5 p-1.5 rounded border border-[#00E5FF]/10">
            <FileCode className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>Target: <span className="text-[#00E5FF]">{attachedChips[0] || "@src"}</span></span>
          </div>
        </div>

        {/* Chat Message History */}
        <div className="space-y-3 pt-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-white ml-6"
                  : msg.sender === "copilot"
                  ? "bg-[#0B1018] border border-[#1E293B] text-[#CBD5E1] mr-4"
                  : "bg-[#090D16] border border-[#1E293B] text-[#64748B] text-[11px]"
              }`}
            >
              <div className="flex items-center justify-between mb-1 font-mono text-[10px] text-[#64748B]">
                <span className="font-semibold text-[#00E5FF] capitalize">{msg.sender}</span>
                <span>{msg.timestamp}</span>
              </div>
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {msg.actionDiff && (
                <div className="mt-2 pt-2 border-t border-[#1E293B] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#94A3B8]">Applied to {msg.actionDiff.file}</span>
                  <span className="text-[#22C55E]">+{msg.actionDiff.additions}</span>
                  <span className="text-[#EF4444]">-{msg.actionDiff.deletions}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Shortcut Buttons */}
      <div className="px-4 py-2 bg-[#0B1018] border-t border-[#1E293B] flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
        <button
          onClick={() => void onGenerateRepair(promptInput || undefined)}
          disabled={isRepairing}
          className="px-2 py-1 rounded bg-[#090D16] border border-[#1E293B] hover:border-[#00E5FF]/40 text-[#CBD5E1] hover:text-[#00E5FF] flex items-center gap-1 transition-colors whitespace-nowrap"
        >
          <Sparkles className="w-3 h-3 text-[#00E5FF]" /> /fix-issue
        </button>
        <button
          onClick={() => void onRunValidation()}
          disabled={isRepairing}
          className="px-2 py-1 rounded bg-[#090D16] border border-[#1E293B] hover:border-[#22C55E]/40 text-[#CBD5E1] hover:text-[#22C55E] flex items-center gap-1 transition-colors whitespace-nowrap"
        >
          <Terminal className="w-3 h-3 text-[#22C55E]" /> /validate
        </button>
        <button
          onClick={() => void onCreatePr()}
          disabled={isRepairing}
          className="px-2 py-1 rounded bg-[#090D16] border border-[#1E293B] hover:border-[#F59E0B]/40 text-[#CBD5E1] hover:text-[#F59E0B] flex items-center gap-1 transition-colors whitespace-nowrap"
        >
          <Code2 className="w-3 h-3 text-[#F59E0B]" /> /create-pr
        </button>
      </div>

      {/* Message Composer Area */}
      <div className="p-3.5 border-t border-[#1E293B] bg-[#0B1018]/95 backdrop-blur-xl">
        {/* Attached Context Chips */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {attachedChips.map((chip) => (
            <div
              key={chip}
              className="flex items-center gap-1 px-2 py-0.5 bg-[#090D16] border border-[#1E293B] rounded text-[11px] font-mono text-[#CBD5E1] hover:border-[#00E5FF]/50 transition-colors"
            >
              <FileCode className="w-3 h-3 text-[#00E5FF]" />
              <span>{chip}</span>
              <button
                onClick={() => onRemoveChip(chip)}
                className="hover:text-[#EF4444] transition-colors ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => onAddChip("@incident-active")}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded text-[10px] font-mono text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors"
          >
            + @incident
          </button>
        </div>

        {/* Input Textarea Box */}
        <div className="relative rounded-xl border border-[#1E293B] bg-[#05070B] focus-within:border-[#00E5FF] focus-within:shadow-[0_0_0_2px_rgba(0,229,255,0.15)] transition-all overflow-hidden border-glow">
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRepairing}
            className="w-full bg-transparent text-white placeholder-[#64748B] p-3 min-h-[85px] max-h-[160px] resize-none focus:outline-none text-xs block leading-relaxed"
            placeholder="Ask OQVEN Copilot to fix, build, test, or refactor... (Ctrl+Enter to send)"
          />

          <div className="flex justify-between items-center p-2 bg-[#0B1018] border-t border-[#1E293B]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAgentMode((m) => (m === "agent" ? "patch" : "agent"))}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-medium text-[#00E5FF] bg-[#00E5FF]/10 rounded hover:bg-[#00E5FF]/20 transition-colors border border-[#00E5FF]/20"
              >
                <Bot className="w-3 h-3" /> {agentMode === "agent" ? "Agent Mode" : "Patch Mode"}
              </button>
            </div>

            <Button
              size="sm"
              onClick={() => void handleSendPrompt()}
              isLoading={isRepairing}
              disabled={isRepairing || !promptInput.trim()}
              className="bg-[#00E5FF] text-[#00363D] hover:bg-[#00E5FF]/90 font-bold text-xs h-7 px-3 gap-1 shadow-sm"
            >
              <span>Send</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="text-center mt-1.5 text-[10px] text-[#64748B] font-mono">
          OQVEN runs patches in an isolated Vercel Sandbox with deterministic tests.
        </div>
      </div>
    </aside>
  );
}
