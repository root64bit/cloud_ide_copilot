import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { AuthGuard } from "@/server/rbac/guard";
import type { engineeringHealthCheckTask } from "@/trigger/engineering-health.task";
import { tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const body = (await req.json().catch(() => ({}))) as { organizationId?: string };
    const organizationId = body.organizationId?.trim();

    if (!organizationId) {
      return NextResponse.json({ ok: false, error: "organizationId is required" }, { status: 400 });
    }

    await AuthGuard.assertPermission(user.id, organizationId, "org:manage_integrations");

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
        tags: [
          "integration:health",
          "provider:trigger-dev",
          `organization:${organizationId}`,
          `requested-by:${user.id}`,
        ],
      }
    );

    return NextResponse.json(
      {
        ok: true,
        queued: true,
        runId: handle.id,
      },
      { status: 202 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to queue Trigger.dev health check" },
      { status: error?.statusCode || 500 }
    );
  }
}
