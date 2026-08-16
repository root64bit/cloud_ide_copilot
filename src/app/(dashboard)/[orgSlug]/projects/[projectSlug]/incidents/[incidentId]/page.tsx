"use client";

import { AiDiagnosisCard } from "@/components/incident/ai-diagnosis-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import type { IncidentDiagnosis } from "@/server/providers/ai/ai.interface";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Box,
  CheckCircle2,
  Clock,
  Code2,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = (params.orgSlug as string) || "acme-corp";
  const projectSlug = (params.projectSlug as string) || "onedealer";
  const incidentId = (params.incidentId as string) || "20000000-0000-0000-0000-000000000001";

  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<IncidentDiagnosis | null>({
    summary: "Unchecked access on optional discountCode property in pricing calculation.",
    probableRootCause:
      "calculateTotal assumes discountCode is always present on cart items, throwing TypeError when empty cart or coupon-less item is processed.",
    confidence: 0.94,
    suspectedFiles: ["src/lib/checkout/pricing.ts"],
    recommendedChanges: [
      "Use optional chaining `discount?.code` and provide safe fallback amount.",
    ],
    risks: ["Zero-dollar pricing if discount object is malformed."],
    recommendedTests: [
      "Unit test for checkout calculation without discount coupon object.",
    ],
    missingInformation: [],
  });

  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  const handleRunDiagnosis = async () => {
    setIsDiagnosing(true);
    try {
      const res = await fetch(`/api/workspaces/ws_temp/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId,
          organizationId: "00000000-0000-0000-0000-000000000001",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDiagnosis(data.diagnosis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleLaunchWorkspace = async () => {
    setIsCreatingWorkspace(true);
    // Redirect to isolated workspace
    setTimeout(() => {
      router.push(`/${orgSlug}/workspaces/ws_onedealer_repair_1`);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${orgSlug}/projects/${projectSlug}`}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Project
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="danger">ERROR</Badge>
              <Badge variant="outline">production</Badge>
              <Badge variant="secondary">Sentry ISSUE-9284</Badge>
            </div>
            <h2 className="text-lg font-bold tracking-tight mt-1 text-foreground">
              TypeError: Cannot read properties of undefined (reading &apos;discountCode&apos;)
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              src/lib/checkout/pricing.ts in calculateTotal
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunDiagnosis}
              isLoading={isDiagnosing}
              className="gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Analyze with AI
            </Button>

            <Button
              size="sm"
              onClick={handleLaunchWorkspace}
              isLoading={isCreatingWorkspace}
              className="gap-1.5"
            >
              <Box className="w-3.5 h-3.5" />
              Create Repair Sandbox
            </Button>
          </div>
        </div>
      </div>

      {/* Overview & Metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 bg-secondary/30">
          <p className="text-[11px] text-muted-foreground">Total Occurrences</p>
          <p className="text-base font-bold text-foreground mt-0.5">42 events</p>
        </Card>
        <Card className="p-3 bg-secondary/30">
          <p className="text-[11px] text-muted-foreground">Affected Commit</p>
          <p className="text-xs font-mono text-foreground mt-0.5">a9f82d1c5e</p>
        </Card>
        <Card className="p-3 bg-secondary/30">
          <p className="text-[11px] text-muted-foreground">Release</p>
          <p className="text-xs font-mono text-foreground mt-0.5">v1.4.2</p>
        </Card>
        <Card className="p-3 bg-secondary/30">
          <p className="text-[11px] text-muted-foreground">Last Seen</p>
          <p className="text-xs text-foreground mt-0.5">5 minutes ago</p>
        </Card>
      </div>

      {/* AI Diagnosis Card */}
      <AiDiagnosisCard diagnosis={diagnosis} isLoading={isDiagnosing} />

      {/* Stack Trace Viewer */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" /> Sentry Stack Trace (Sanitized)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2 text-xs font-mono">
          <div className="p-3 rounded-md bg-secondary/40 border border-border/50 text-foreground">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span className="text-rose-400 font-semibold">src/lib/checkout/pricing.ts:48</span>
              <span>calculateTotal</span>
            </div>
            <pre className="text-[11px] text-zinc-300 overflow-x-auto bg-zinc-950 p-2 rounded">
              {`46 |   let discountAmount = 0;
47 |   if (item.discountCode) {
48 >     discountAmount = item.price * (item.discountCode.percent / 100);
49 |   }
50 |   return total - discountAmount;`}
            </pre>
          </div>

          <div className="p-3 rounded-md bg-secondary/20 border border-border/30 text-muted-foreground">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span>src/app/api/checkout/route.ts:112</span>
              <span>POST</span>
            </div>
            <pre className="text-[11px] text-zinc-400 overflow-x-auto bg-zinc-950/60 p-2 rounded">
              {`111 |   const cart = await req.json();
112 >   const total = calculateTotal(cart);
113 |   return NextResponse.json({ total });`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
