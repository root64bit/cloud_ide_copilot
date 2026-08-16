"use client";

import { formatDate, formatTimeAgo } from "@/lib/utils";
import { History, ShieldCheck, Terminal, User } from "lucide-react";
import React from "react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export interface AuditEventItem {
  id: string;
  organization_id: string;
  project_id?: string | null;
  workspace_id?: string | null;
  user_id?: string | null;
  event_type: string;
  metadata: Record<string, any>;
  ip_hash?: string | null;
  created_at: string;
}

export function AuditEventList({ events }: { events: AuditEventItem[] }) {
  if (!events || events.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-xs">
          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No audit records logged yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Immutable Security Audit Trail
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono">
            Append-Only Trigger Protected
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-border/60">
        {events.map((evt) => (
          <div key={evt.id} className="p-4 hover:bg-secondary/30 transition-colors text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-[10px] text-primary">
                  {evt.event_type}
                </Badge>
                {evt.user_id && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" /> {evt.user_id}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">{formatDate(evt.created_at)}</span>
            </div>

            {evt.metadata && Object.keys(evt.metadata).length > 0 && (
              <pre className="text-[10px] bg-secondary/50 p-2 rounded text-zinc-300 font-mono overflow-x-auto">
                {JSON.stringify(evt.metadata, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
