import { cn } from "@/lib/utils";
import React from "react";

export interface DiffViewerProps {
  filePath: string;
  originalCode?: string;
  modifiedCode?: string;
  diffSummary?: string;
  className?: string;
}

export function DiffViewer({
  filePath,
  originalCode,
  modifiedCode,
  diffSummary,
  className,
}: DiffViewerProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-zinc-950 font-mono text-xs overflow-hidden shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900 border-b border-zinc-800 text-[11px] text-zinc-300">
        <span className="font-semibold text-primary">{filePath}</span>
        {diffSummary && <span className="text-zinc-400">{diffSummary}</span>}
      </div>

      <div className="p-3 text-zinc-300 overflow-x-auto divide-y divide-zinc-800/40">
        {originalCode && (
          <div className="bg-rose-950/20 p-2.5 rounded border border-rose-900/30 mb-2">
            <div className="text-[10px] text-rose-400 font-semibold mb-1 select-none">
              --- Original (Base Commit)
            </div>
            <pre className="text-rose-300/90 whitespace-pre-wrap">{originalCode}</pre>
          </div>
        )}

        {modifiedCode && (
          <div className="bg-emerald-950/20 p-2.5 rounded border border-emerald-900/30">
            <div className="text-[10px] text-emerald-400 font-semibold mb-1 select-none">
              +++ Proposed AI Patch (Sandbox)
            </div>
            <pre className="text-emerald-300 whitespace-pre-wrap">{modifiedCode}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
