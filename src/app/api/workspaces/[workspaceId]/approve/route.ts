import { NextResponse } from "next/server";

/**
 * The current repository does not yet have the authenticated persisted release gate needed
 * to authorize a production merge. Never simulate a successful production deployment.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "PRODUCTION_RELEASE_GATE_NOT_WIRED",
      message:
        "Production approval/merge is disabled until real authentication, deterministic validation, GitHub App PR state, and Vercel Preview checks are all persisted and verified.",
    },
    { status: 503 }
  );
}
