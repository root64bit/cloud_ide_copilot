import { ProjectRepo } from "@/lib/supabase/repositories";
import { SentryIncidentProvider } from "@/server/providers/incident/sentry.provider";
import { IncidentService } from "@/server/services/incident.service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("sentry-hook-signature");

    const sentryProvider = new SentryIncidentProvider();

    // Verify Sentry HMAC signature
    const isValid = sentryProvider.verifyWebhook(rawBody, signature);
    if (!isValid && process.env.NODE_ENV === "production" && process.env.ALLOW_MOCK_PROVIDERS !== "true") {
      return NextResponse.json(
        { error: "Invalid Sentry webhook signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody || "{}");
    const normalized = sentryProvider.normalizeWebhook(payload);

    // Resolve project from payload or project repository
    const defaultOrgId = "00000000-0000-0000-0000-000000000001";
    let project = null;

    if (payload.project_slug || payload.project) {
      const slug = payload.project_slug || payload.project;
      project = await ProjectRepo.findBySlug(defaultOrgId, String(slug));
    }

    if (!project) {
      const projects = await ProjectRepo.listByOrg(defaultOrgId);
      project = projects[0] || null;
    }

    if (!project) {
      return NextResponse.json(
        { error: "No connected project matched for Sentry incident" },
        { status: 404 }
      );
    }

    const incident = await IncidentService.ingestIncident(
      project.organization_id,
      project.id,
      normalized
    );

    return NextResponse.json(
      {
        received: true,
        incidentId: incident.id,
        projectId: project.id,
        status: "queued_for_processing",
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Webhook processing error" },
      { status: 400 }
    );
  }
}
