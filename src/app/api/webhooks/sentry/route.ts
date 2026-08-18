import { ProjectIntegrationRepo, ProjectRepo } from "@/lib/supabase/repositories";
import { SentryIncidentProvider } from "@/server/providers/incident/sentry.provider";
import { IncidentService } from "@/server/services/incident.service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sentryProjectCandidates(payload: any): string[] {
  const values = [
    payload?.data?.issue?.project?.id,
    payload?.data?.issue?.project?.slug,
    payload?.data?.event?.project,
    payload?.data?.event?.project_id,
    payload?.project?.id,
    payload?.project?.slug,
    payload?.project_id,
    payload?.project_slug,
  ];
  return [...new Set(values.filter((value) => value !== null && value !== undefined && String(value).trim()).map(String))];
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("sentry-hook-signature");
    const sentryProvider = new SentryIncidentProvider();
    if (!sentryProvider.verifyWebhook(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid Sentry webhook signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || "{}");
    const normalized = sentryProvider.normalizeWebhook(payload);
    let project: any = null;

    for (const externalId of sentryProjectCandidates(payload)) {
      const integration = await ProjectIntegrationRepo.findByProviderExternalId("sentry", externalId);
      if (!integration || integration.status !== "connected") continue;
      project = await ProjectRepo.findByIdAny(integration.project_id);
      if (project) break;
    }

    if (!project) {
      return NextResponse.json(
        { error: "SENTRY_PROJECT_NOT_CONNECTED: webhook project did not match an explicit Sentry project integration" },
        { status: 404 }
      );
    }

    const incident = await IncidentService.ingestIncident(project.organization_id, project.id, normalized);
    return NextResponse.json({ received: true, incidentId: incident.id, projectId: project.id, status: "persisted" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Webhook processing error" }, { status: 400 });
  }
}
