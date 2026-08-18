import { resolveWorkspaceTenant } from "@/lib/supabase/auth";
import { redactSecrets } from "@/lib/security/redaction";
import { runs } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  if (!process.env.TRIGGER_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: "TRIGGER_NOT_CONFIGURED" }, { status: 503 });
  }
  try {
    const { runId } = await params;
    if (!/^run_[A-Za-z0-9_-]+$/.test(runId)) {
      return NextResponse.json({ ok: false, error: "INVALID_RUN_ID" }, { status: 400 });
    }
    const workspaceId = new URL(request.url).searchParams.get("workspaceId");
    if (!workspaceId) return NextResponse.json({ ok: false, error: "workspaceId is required" }, { status: 400 });
    await resolveWorkspaceTenant(request, workspaceId);

    const run: any = await runs.retrieve(runId);
    const tags = Array.isArray(run.tags) ? run.tags : [];
    if (!tags.includes(`workspace:${workspaceId}`)) {
      return NextResponse.json({ ok: false, error: "TRIGGER_RUN_WORKSPACE_MISMATCH" }, { status: 403 });
    }

    const completed = ["COMPLETED", "FAILED", "CRASHED", "CANCELED", "INTERRUPTED", "SYSTEM_FAILURE", "EXPIRED"].includes(run.status);
    const failedAttempt = run.attempts?.filter((attempt: any) => attempt?.error)?.at(-1);
    const runError = run.error || failedAttempt?.error;
    return NextResponse.json({
      ok: true,
      run: {
        id: run.id,
        taskIdentifier: run.taskIdentifier,
        status: run.status,
        completed,
        isSuccess: run.status === "COMPLETED",
        output: run.status === "COMPLETED" ? run.output : undefined,
        error: run.status === "COMPLETED" || !runError ? undefined : redactSecrets(JSON.stringify(runError)).slice(0, 4_000),
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        durationMs: run.durationMs,
        costInCents: run.costInCents,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: redactSecrets(error instanceof Error ? error.message : "Unable to retrieve Trigger.dev run") }, { status: 502 });
  }
}
