import { NextResponse } from "next/server";

/**
 * Validation must be based on real process exit codes in an isolated sandbox.
 * This route deliberately refuses to fabricate a PASS result.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "VALIDATION_PIPELINE_NOT_WIRED",
      message:
        "Deterministic validation is disabled until the real Vercel Sandbox provider can run install/test/lint/typecheck/build.",
    },
    { status: 503 }
  );
}
