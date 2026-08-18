import { AuditLogger } from "@/lib/audit/logger";
import { resolveWorkspaceTenant } from "@/lib/supabase/auth";
import { RepairArtifactRepo } from "@/lib/supabase/repositories";
import { VercelSandboxProvider } from "@/server/providers/sandbox/vercel-sandbox.provider";
import { WorkspaceService } from "@/server/services/workspace.service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { user, tenant, workspace } = await resolveWorkspaceTenant(req, workspaceId);
    if (!workspace.sandbox_id) return NextResponse.json({ error: "Workspace has no Vercel Sandbox" }, { status: 409 });
    const artifact = await RepairArtifactRepo.findByWorkspaceId(workspaceId);
    if (!artifact || artifact.organization_id !== tenant.organizationId || artifact.project_id !== workspace.project_id) {
      return NextResponse.json({ error: "No verified repair artifact exists for this workspace" }, { status: 404 });
    }
    if (!artifact.patch_content?.trim() || artifact.patch_content.startsWith("No git diff")) {
      return NextResponse.json({ error: "Repair artifact contains no source patch" }, { status: 409 });
    }

    const provider = new VercelSandboxProvider();
    const applied = await provider.applyPatch(workspace.sandbox_id, artifact.patch_content);
    if (!applied.success) {
      await RepairArtifactRepo.updateStatus(artifact.id, "failed", { sandboxApplyError: applied.output });
      return NextResponse.json({ error: "Patch failed deterministic git apply validation", details: applied.output }, { status: 409 });
    }

    await RepairArtifactRepo.updateStatus(artifact.id, "completed", { sandboxApplied: true, sandboxApplyOutput: applied.output });
    if (workspace.status === "repairing") {
      await WorkspaceService.updateStatus(user.id, tenant.organizationId, workspaceId, "ready");
    }
    await AuditLogger.log({
      organizationId: tenant.organizationId,
      projectId: workspace.project_id,
      workspaceId,
      userId: user.id,
      eventType: "repair_artifact.synced_to_sandbox",
      metadata: { artifactId: artifact.id, filesChanged: artifact.files_changed },
    });
    return NextResponse.json({ ok: true, artifactId: artifact.id, filesChanged: artifact.files_changed, output: applied.output });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unable to synchronize repair artifact" }, { status: error?.statusCode || 500 });
  }
}
