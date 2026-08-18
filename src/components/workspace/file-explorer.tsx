"use client";

import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Code2,
  FileCode,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
  Search,
} from "lucide-react";
import React, { useState } from "react";

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
  status?: "modified" | "added" | "untracked";
}

const DEFAULT_FILE_TREE: FileTreeNode[] = [
  {
    name: "src",
    path: "src",
    type: "folder",
    children: [
      {
        name: "services",
        path: "src/services",
        type: "folder",
        children: [
          { name: "auth.service.ts", path: "src/services/auth.service.ts", type: "file", status: "modified" },
          { name: "auth.service.test.ts", path: "src/services/auth.service.test.ts", type: "file" },
          { name: "user.service.ts", path: "src/services/user.service.ts", type: "file" },
        ],
      },
      {
        name: "server",
        path: "src/server",
        type: "folder",
        children: [
          { name: "git-pr.service.ts", path: "src/server/services/git-pr.service.ts", type: "file" },
          { name: "workspace.service.ts", path: "src/server/services/workspace.service.ts", type: "file" },
          { name: "incident.service.ts", path: "src/server/services/incident.service.ts", type: "file" },
        ],
      },
      {
        name: "components",
        path: "src/components",
        type: "folder",
        children: [
          { name: "copilot-chat.tsx", path: "src/components/copilot-chat.tsx", type: "file", status: "added" },
          { name: "diff-viewer.tsx", path: "src/components/ui/diff-viewer.tsx", type: "file" },
        ],
      },
      { name: "middleware.ts", path: "src/middleware.ts", type: "file" },
    ],
  },
  {
    name: "supabase",
    path: "supabase",
    type: "folder",
    children: [
      { name: "00006_release_observation_hardening.sql", path: "supabase/migrations/00006_release_observation_hardening.sql", type: "file" },
      { name: "seed.sql", path: "supabase/seed.sql", type: "file" },
    ],
  },
  { name: "package.json", path: "package.json", type: "file" },
  { name: "tsconfig.json", path: "tsconfig.json", type: "file" },
];

function getFileIcon(name: string) {
  if (name.endsWith(".json")) return <FileJson className="w-3.5 h-3.5 text-[#F59E0B]" />;
  if (name.endsWith(".ts") || name.endsWith(".tsx")) return <FileCode className="w-3.5 h-3.5 text-[#00E5FF]" />;
  return <FileText className="w-3.5 h-3.5 text-[#94A3B8]" />;
}

export function FileExplorer({
  activeFile,
  onSelectFile,
  onAttachContext,
}: {
  activeFile: string;
  onSelectFile: (filePath: string) => void;
  onAttachContext?: (filePath: string) => void;
}) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    src: true,
    "src/services": true,
    "src/server": false,
    "src/components": false,
    supabase: false,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const renderNode = (node: FileTreeNode, depth = 0) => {
    const isFolder = node.type === "folder";
    const isOpen = openFolders[node.path];
    const isSelected = activeFile === node.path;

    if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase()) && !isFolder) {
      return null;
    }

    return (
      <div key={node.path} className="select-none">
        <div
          onClick={() => (isFolder ? toggleFolder(node.path) : onSelectFile(node.path))}
          onDoubleClick={() => onAttachContext && onAttachContext(node.name)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className={cn(
            "flex items-center gap-1.5 py-1 pr-2 rounded text-xs cursor-pointer transition-colors group",
            isSelected
              ? "bg-[#00E5FF]/10 text-[#00E5FF] font-medium border-l-2 border-[#00E5FF]"
              : "text-[#CBD5E1] hover:bg-[#0B1018] hover:text-white"
          )}
        >
          {isFolder ? (
            <>
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
              )}
              {isOpen ? (
                <FolderOpen className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
              )}
            </>
          ) : (
            <>
              <span className="w-3.5 shrink-0" />
              {getFileIcon(node.name)}
            </>
          )}

          <span className="truncate">{node.name}</span>

          {node.status === "modified" && (
            <span className="ml-auto text-[9px] font-mono text-[#F59E0B] px-1 rounded bg-[#F59E0B]/10">
              M
            </span>
          )}
          {node.status === "added" && (
            <span className="ml-auto text-[9px] font-mono text-[#22C55E] px-1 rounded bg-[#22C55E]/10">
              A
            </span>
          )}
        </div>

        {isFolder && isOpen && node.children && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-60 border-r border-[#1E293B] bg-[#090D16] flex flex-col shrink-0 h-full">
      {/* Header */}
      <div className="h-10 border-b border-[#1E293B] px-3 flex items-center justify-between text-[#64748B] text-[11px] font-mono uppercase tracking-wider">
        <span>Files & Explorer</span>
        <Code2 className="w-3.5 h-3.5 text-[#00E5FF]" />
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-[#1E293B]">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#0B1018] rounded border border-[#1E293B] text-xs">
          <Search className="w-3 h-3 text-[#64748B]" />
          <input
            type="text"
            placeholder="Filter files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-white text-xs placeholder:text-[#64748B] focus:outline-none"
          />
        </div>
      </div>

      {/* File Tree List */}
      <div className="p-2 flex-1 overflow-y-auto space-y-0.5 font-mono">
        {DEFAULT_FILE_TREE.map((node) => renderNode(node, 0))}
      </div>

      {/* Explorer Footer Tip */}
      <div className="p-2.5 border-t border-[#1E293B] bg-[#0B1018] text-[10px] text-[#64748B] font-mono">
        Double click file to attach to Copilot prompt
      </div>
    </aside>
  );
}
