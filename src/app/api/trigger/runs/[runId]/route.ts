import { redactSecrets } from "@/lib/security/redaction";
import { runs } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  if (!process.env.TRIGGER_SECRET_KEY) {
    return NextResponse.json(
      { ok: false, error: "TRIGGER_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  try {
    const { runId } = await params;
    if (!/^run_[A-Za-z0-9_-]+$/.test(runId)) {
      return NextResponse.json({ ok: false, error: "INVALID_RUN_ID" }, { status: 400 });
    }

    const run = await runs.retrieve(runId);
    const completed = [
      "COMPLETED",
      "FAILED",
      "CRASHED",
      "CANCELED",
      "INTERRUPTED",
      "SYSTEM_FAILURE",
      "EXPIRED",
    ].includes(run.status);

    const runAny = run as any;
    const failedAttempt = runAny.attempts?.filter((attempt: any) => attempt?.error)?.at(-1);
    const runError = runAny.error || failedAttempt?.error;

    return NextResponse.json({
      ok: true,
      run: {
        id: run.id,
        taskIdentifier: run.taskIdentifier,
        status: run.status,
        completed,
        isSuccess: run.status === "COMPLETED",
        output: run.status === "COMPLETED" ? run.output : undefined,
        error:
          run.status === "COMPLETED" || !runError
            ? undefined
            : redactSecrets(JSON.stringify(runError)).slice(0, 4_000),
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        durationMs: run.durationMs,
        costInCents: run.costInCents,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: redactSecrets(error instanceof Error ? error.message : "Unable to retrieve Trigger.dev run"),
      },
      { status: 502 }
    );
  }
}
