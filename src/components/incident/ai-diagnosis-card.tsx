"use client";

import type { IncidentDiagnosis } from "@/server/providers/ai/ai.interface";
import { AlertTriangle, Bot, CheckCircle2, Code2, ShieldAlert, Sparkles } from "lucide-react";
import React from "react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function AiDiagnosisCard({
  diagnosis,
  isLoading,
}: {
  diagnosis: IncidentDiagnosis | null;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="border-primary/40 bg-primary/5 animate-pulse">
        <CardContent className="p-6 text-center space-y-2">
          <Bot className="w-8 h-8 text-primary mx-auto animate-bounce" />
          <h4 className="text-sm font-semibold text-foreground">AI Incident Analysis in Progress...</h4>
          <p className="text-xs text-muted-foreground">
            Correlating Sentry stacktrace, AST, and repo files via OpenRouter & OpenHands
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!diagnosis) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No AI diagnosis generated yet. Click "Analyze with AI" above.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/40 shadow-sm">
      <CardHeader className="bg-primary/5 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" /> AI Root Cause Diagnosis
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <Badge variant="success" className="font-mono">
              {Math.round(diagnosis.confidence * 100)}%
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4 text-xs">
        <div>
          <h5 className="font-semibold text-foreground mb-1">Incident Summary</h5>
          <p className="text-muted-foreground leading-relaxed">{diagnosis.summary}</p>
        </div>

        <div className="p-3 rounded-md bg-secondary/50 border border-border/60">
          <h5 className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-primary" /> Technical Root Cause
          </h5>
          <p className="text-muted-foreground leading-relaxed font-mono text-[11px]">
            {diagnosis.probableRootCause}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <h5 className="font-semibold text-foreground flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-amber-400" /> Suspected Source Files
            </h5>
            <ul className="space-y-1">
              {diagnosis.suspectedFiles.map((file, idx) => (
                <li key={idx} className="font-mono text-[11px] bg-secondary/70 px-2 py-1 rounded text-primary">
                  {file}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <h5 className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Recommended Tests
            </h5>
            <ul className="space-y-1">
              {diagnosis.recommendedTests.map((test, idx) => (
                <li key={idx} className="text-muted-foreground bg-secondary/40 px-2 py-1 rounded">
                  • {test}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {diagnosis.risks.length > 0 && (
          <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300">
            <h5 className="font-semibold flex items-center gap-1.5 mb-1 text-rose-200">
              <ShieldAlert className="w-3.5 h-3.5" /> Identified Risks
            </h5>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              {diagnosis.risks.map((risk, idx) => (
                <li key={idx}>{risk}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
