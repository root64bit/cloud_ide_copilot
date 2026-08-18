"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  GitPullRequest,
  Lock,
  ShieldCheck,
} from "lucide-react";
import React, { useState } from "react";
import { Alert } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export interface PrApprovalViewProps {
  workspaceStatus: string;
  pullRequest?: {
    number: number;
    url: string;
    branch: string;
    status: string;
  } | null;
  previewUrl?: string | null;
  onCreatePr: () => void;
  onApproveAndMerge: (notes: string) => void;
  isCreatingPr?: boolean;
  isApproving?: boolean;
  blockedReason?: string;
}

export function PrApprovalView({
  workspaceStatus,
  pullRequest,
  previewUrl,
  onCreatePr,
  onApproveAndMerge,
  isCreatingPr,
  isApproving,
  blockedReason,
}: PrApprovalViewProps) {
  const [approvalNotes, setApprovalNotes] = useState("");
  const [confirmedSafe, setConfirmedSafe] = useState(false);

  const isPreviewReady =
    workspaceStatus === "preview_ready" ||
    workspaceStatus === "approved" ||
    workspaceStatus === "merged" ||
    workspaceStatus === "completed";

  const isMerged = workspaceStatus === "merged" || workspaceStatus === "completed";
  const productionObserved = workspaceStatus === "completed";

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <GitPullRequest className="w-4 h-4 text-primary" /> Pull Request & Production Gate
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4 text-xs">
        {blockedReason ? (
          <Alert variant="warning" title="Release path not enabled yet">
            {blockedReason}
          </Alert>
        ) : null}
        {/* PR Section */}
        {!pullRequest ? (
          <div className="p-4 rounded-md border border-dashed text-center space-y-3 bg-secondary/20">
            <GitBranch className="w-8 h-8 text-muted-foreground mx-auto opacity-70" />
            <div>
              <h5 className="font-semibold text-foreground">No Pull Request Created Yet</h5>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                Ensure validation checks pass, then create an isolated Git branch and PR.
              </p>
            </div>

            <Button
              size="sm"
              onClick={onCreatePr}
              isLoading={isCreatingPr}
              disabled={Boolean(blockedReason) || isCreatingPr || workspaceStatus !== "ready_for_review"}
              className="gap-1.5"
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              Create Repair Branch & PR
            </Button>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg border border-border bg-secondary/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-foreground">
                  Pull Request #{pullRequest.number}
                </span>
                <Badge variant={isMerged ? "success" : "default"}>
                  {isMerged ? "Merged" : "Open"}
                </Badge>
              </div>

              <a
                href={pullRequest.url}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="text-[11px] font-mono text-muted-foreground">
              Branch: <span className="text-foreground">{pullRequest.branch}</span>
            </div>

            {/* Vercel Preview */}
            {previewUrl && (
              <div className="p-2.5 rounded bg-card border border-border flex items-center justify-between mt-2">
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Vercel Preview Ready
                  </div>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline text-[11px] truncate block max-w-xs sm:max-w-md"
                  >
                    {previewUrl}
                  </a>
                </div>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-[11px] font-medium transition-colors"
                >
                  Test Preview
                </a>
              </div>
            )}
          </div>
        )}

        {/* Human Production Approval Gate */}
        <div className="p-4 rounded-lg border border-border bg-card/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <h5 className="font-semibold text-foreground">Explicit Human Approval Gate</h5>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Requires Owner / Admin
            </Badge>
          </div>

          <p className="text-muted-foreground text-[11px] leading-relaxed">
            Production merges and live deployments are protected. AI agents cannot merge or deploy to production autonomously.
          </p>

          {productionObserved ? (
            <Alert variant="success" title="Production Deployment Observed">
              The human-approved merge commit has been observed in a READY Vercel production deployment.
            </Alert>
          ) : workspaceStatus === "merged" ? (
            <Alert variant="warning" title="Merged — waiting for production evidence">
              GitHub merge completed. The workspace will remain open until Vercel reports a READY production deployment for the exact merge commit.
            </Alert>
          ) : (
            <div className="space-y-3 pt-2">
              <input
                type="text"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Audit Note (e.g. 'Verified checkout fix on iOS preview, ready for production')"
                className="w-full h-8 px-3 rounded border border-input bg-card text-xs"
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confirm-safe"
                  checked={confirmedSafe}
                  onChange={(e) => setConfirmedSafe(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <label htmlFor="confirm-safe" className="text-[11px] text-muted-foreground cursor-pointer">
                  I have verified the Vercel preview and authorize immediate production merge.
                </label>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => onApproveAndMerge(approvalNotes)}
                isLoading={isApproving}
                disabled={Boolean(blockedReason) || !confirmedSafe || !pullRequest || isApproving || isMerged || !isPreviewReady}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <ShieldCheck className="w-4 h-4" />
                Approve & Merge to Production
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
