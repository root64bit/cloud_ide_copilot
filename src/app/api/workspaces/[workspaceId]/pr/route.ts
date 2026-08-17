import { NextResponse } from "next/server";

/**
 * Fail closed until OpenHands changes are synchronized into a deterministic validated
 * workspace and pushed with a real GitHub App installation token.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "GITHUB_REPAIR_PUSH_NOT_WIRED",
      message:
        "Pull request creation is disabled until the real OpenHands diff -> Vercel Sandbox validation -> GitHub App commit/push path is implemented.",
    },
    { status: 503 }
  );
}
