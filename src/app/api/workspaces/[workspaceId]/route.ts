import { resolveWorkspaceTenant } from "@/lib/supabase/auth";
import {
  DeploymentRepo,
  PullRequestRepo,
  RepairArtifactRepo,
} from "@/lib/supabase/repositories";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { workspace } = await resolveWorkspaceTenant(req, workspaceId);
    const [pullRequest, deployments, repairArtifact] = await Promise.all([
      PullRequestRepo.findByWorkspaceId(workspaceId),
      DeploymentRepo.listByWorkspace(workspaceId),
      RepairArtifactRepo.findByWorkspaceId(workspaceId),
    ]);

    const preview = deployments.find((deployment: any) => deployment.environment === "preview") || null;
    const production = deployments.find((deployment: any) => deployment.environment === "production") || null;

    return NextResponse.json({
      ok: true,
      workspace,
      pullRequest,
      preview,
      production,
      repairArtifact: repairArtifact
        ? {
            id: repairArtifact.id,
            status: repairArtifact.status,
            conversationId: repairArtifact.conversation_id,
            patchContent: repairArtifact.patch_content,
            filesChanged: repairArtifact.files_changed,
            stats: repairArtifact.stats,
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load workspace" },
      { status: error?.statusCode || 500 }
    );
  }
}
