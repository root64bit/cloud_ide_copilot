import type { engineeringHealthCheckTask } from "@/trigger/engineering-health.task";
import { tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  if (!process.env.TRIGGER_SECRET_KEY) {
    return NextResponse.json(
      { ok: false, error: "TRIGGER_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const handle = await tasks.trigger<typeof engineeringHealthCheckTask>(
    "engineering-health-check",
    {
      source: "cloud-ide-copilot",
      nonce: crypto.randomUUID(),
    },
    {
      tags: ["integration:health", "provider:trigger-dev"],
    }
  );

  return NextResponse.json(
    {
      ok: true,
      queued: true,
      runId: handle.id,
      publicAccessToken: handle.publicAccessToken,
    },
    { status: 202 }
  );
}
