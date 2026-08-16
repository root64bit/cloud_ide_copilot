import { InMemoryDatabase } from "@/lib/supabase/server";
import { SentryIncidentProvider } from "@/server/providers/incident/sentry.provider";
import { IncidentService } from "@/server/services/incident.service";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("sentry-hook-signature");

    const sentryProvider = new SentryIncidentProvider();

    // Verify Sentry HMAC signature
    const isValid = sentryProvider.verifyWebhook(rawBody, signature);
    if (!isValid && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Invalid Sentry webhook signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody || "{}");
    const normalized = sentryProvider.normalizeWebhook(payload);

    // Ingest incident under active organization & matched project
    const defaultOrgId = "00000000-0000-0000-0000-000000000001";
    const defaultProjId = "10000000-0000-0000-0000-000000000001";

    const incident = await IncidentService.ingestIncident(
      defaultOrgId,
      defaultProjId,
      normalized
    );

    return NextResponse.json(
      {
        received: true,
        incidentId: incident.id,
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
