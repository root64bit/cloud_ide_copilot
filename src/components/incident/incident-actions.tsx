"use client";

import { AiDiagnosisCard } from "@/components/incident/ai-diagnosis-card";
import { Button } from "@/components/ui/button";
import type { IncidentDiagnosis } from "@/server/providers/ai/ai.interface";
import { Box, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function IncidentActions({
  organizationId,
  projectId,
  incidentId,
  orgSlug,
}: {
  organizationId: string;
  projectId: string;
  incidentId: string;
  orgSlug: string;
}) {
  const router = useRouter();
  const [diagnosis, setDiagnosis] = useState<IncidentDiagnosis | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const diagnose = async () => {
    setDiagnosing(true);
    setError(null);
    try {
      const response = await fetch(`/api/incidents/${encodeURIComponent(incidentId)}/analyze`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "AI diagnosis failed");
      setDiagnosis(data.diagnosis);
    } catch (diagnosisError) {
      setError(diagnosisError instanceof Error ? diagnosisError.message : "AI diagnosis failed");
    } finally {
      setDiagnosing(false);
    }
  };

  const createWorkspace = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, projectId, incidentId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Workspace creation failed");
      router.push(`/${orgSlug}/workspaces/${data.workspace.id}`);
      router.refresh();
    } catch (workspaceError) {
      setError(workspaceError instanceof Error ? workspaceError.message : "Workspace creation failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={diagnose} isLoading={diagnosing} className="gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Analyze with AI
        </Button>
        <Button size="sm" onClick={createWorkspace} isLoading={creating} className="gap-1.5">
          <Box className="w-3.5 h-3.5" /> Create Repair Workspace
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <AiDiagnosisCard diagnosis={diagnosis} isLoading={diagnosing} />
    </div>
  );
}
