import { NextResponse } from "next/server";

/**
 * Fail closed until the real @vercel/sandbox provider is wired.
 * Returning simulated command output would create false release evidence.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "VERCEL_SANDBOX_NOT_WIRED",
      message:
        "Sandbox commands are disabled until the real @vercel/sandbox provider and persistent workspace storage are enabled.",
    },
    { status: 503 }
  );
}
