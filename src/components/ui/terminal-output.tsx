import { cn } from "@/lib/utils";
import React from "react";

export interface TerminalOutputProps {
  title?: string;
  output: string;
  className?: string;
  status?: "pending" | "running" | "passed" | "failed";
}

export function TerminalOutput({
  title = "Sandbox Terminal Output",
  output,
  className,
  status = "passed",
}: TerminalOutputProps) {
  return (
    <div className={cn("rounded-lg border border-border/80 bg-zinc-950 text-zinc-100 shadow-md font-mono text-xs overflow-hidden", className)}>
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800 text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="font-semibold text-zinc-300 ml-1">{title}</span>
        </div>
        <div>
          {status === "passed" && (
            <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded text-[10px]">
              Exit Code: 0
            </span>
          )}
          {status === "failed" && (
            <span className="text-rose-400 bg-rose-900/40 border border-rose-800/40 px-2 py-0.5 rounded text-[10px]">
              Exit Code: 1 (Failed)
            </span>
          )}
          {status === "running" && (
            <span className="text-amber-400 bg-amber-900/40 border border-amber-800/40 px-2 py-0.5 rounded text-[10px] animate-pulse">
              Running...
            </span>
          )}
        </div>
      </div>
      <pre className="p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[380px] select-text text-zinc-300">
        {output || "// No command output recorded."}
      </pre>
    </div>
  );
}
