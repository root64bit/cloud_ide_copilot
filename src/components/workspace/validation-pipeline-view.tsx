"use client";

import type { ValidationPipelineResult } from "@/server/services/validation.service";
import { CheckCircle2, Loader2, Play, ShieldAlert, XCircle } from "lucide-react";
import React from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export interface ValidationPipelineViewProps {
  workspaceStatus: string;
  onRunValidation: () => void;
  isRunning?: boolean;
  result?: ValidationPipelineResult | null;
}

export function ValidationPipelineView({
  workspaceStatus,
  onRunValidation,
  isRunning,
  result,
}: ValidationPipelineViewProps) {
  const steps = [
    { key: "install", label: "Dependency Installation (npm ci)" },
    { key: "test", label: "Automated Unit & Regression Tests (npm test)" },
    { key: "lint", label: "Static Code Analysis (ESLint)" },
    { key: "typecheck", label: "TypeScript Strict Typecheck (tsc)" },
    { key: "build", label: "Next.js Production Bundle Build (npm run build)" },
  ];

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            Automated Validation Gate
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Validation checks must strictly pass before a Pull Request can be reviewed or merged.
          </p>
        </div>

        <Button
          size="sm"
          onClick={onRunValidation}
          isLoading={isRunning}
          disabled={isRunning || workspaceStatus === "stopped"}
          className="gap-1.5"
        >
          <Play className="w-3.5 h-3.5" />
          Run Validation Pipeline
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          {steps.map((step, idx) => {
            const stepResult = result?.stepResults?.find((r) => r.step === step.key);
            const isPassed = stepResult?.passed;
            const isFailed = stepResult && !stepResult.passed;

            return (
              <div
                key={step.key}
                className="flex items-center justify-between p-2.5 rounded-md bg-secondary/40 border border-border/50 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] text-muted-foreground w-4">
                    0{idx + 1}
                  </span>
                  <span className="font-medium text-foreground">{step.label}</span>
                </div>

                <div>
                  {isRunning && !stepResult && (
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                      <Loader2 className="w-3 h-3 animate-spin" /> Pending...
                    </span>
                  )}
                  {isPassed && (
                    <Badge variant="success" className="gap-1 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" /> Passed (Exit 0)
                    </Badge>
                  )}
                  {isFailed && (
                    <Badge variant="danger" className="gap-1 text-[10px]">
                      <XCircle className="w-3 h-3" /> Failed
                    </Badge>
                  )}
                  {!isRunning && !stepResult && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Ready
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {result && !result.allPassed && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              Validation failed. The repair cannot proceed to Pull Request or Production until issues are resolved.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
