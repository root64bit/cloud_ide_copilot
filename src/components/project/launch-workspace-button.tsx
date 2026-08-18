"use client";

import { Button } from "@/components/ui/button";
import { Box } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LaunchWorkspaceButton({
  organizationId,
  projectId,
  orgSlug,
  incidentId,
}: {
  organizationId: string;
  projectId: string;
  orgSlug: string;
  incidentId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const launch = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, projectId, incidentId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to create repair workspace");
      router.push(`/${orgSlug}/workspaces/${data.workspace.id}`);
      router.refresh();
    } catch (launchError) {
      setError(launchError instanceof Error ? launchError.message : "Unable to create repair workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={launch} isLoading={loading} className="gap-1.5">
        <Box className="w-3.5 h-3.5" /> Launch Sandbox Workspace
      </Button>
      {error ? <span className="text-[10px] text-destructive max-w-xs text-right">{error}</span> : null}
    </div>
  );
}
