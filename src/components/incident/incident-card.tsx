"use client";

import { formatTimeAgo } from "@/lib/utils";
import { AlertCircle, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";

export interface IncidentCardProps {
  orgSlug: string;
  projectSlug: string;
  incident: {
    id: string;
    title: string;
    level: string;
    environment: string;
    culprit?: string | null;
    status: string;
    occurrence_count: number;
    last_seen_at: string;
  };
}

export function IncidentCard({ orgSlug, projectSlug, incident }: IncidentCardProps) {
  const isResolved = incident.status === "resolved";

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={incident.level === "fatal" || incident.level === "error" ? "danger" : "warning"}>
              {incident.level}
            </Badge>
            <Badge variant="outline">{incident.environment}</Badge>
            {isResolved ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="w-3 h-3" /> Resolved
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="w-3 h-3 text-amber-400" /> {incident.status}
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatTimeAgo(incident.last_seen_at)}
            </span>
          </div>

          <h4 className="text-sm font-semibold text-foreground truncate">{incident.title}</h4>

          {incident.culprit && (
            <p className="text-xs text-muted-foreground font-mono truncate">{incident.culprit}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-foreground">{incident.occurrence_count}</div>
            <div className="text-[10px] text-muted-foreground">events</div>
          </div>

          <Link
            href={`/${orgSlug}/projects/${projectSlug}/incidents/${incident.id}`}
            className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground text-xs font-medium transition-colors"
          >
            <span>Triage & Diagnose</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
