import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Public liveness endpoint only.
 * This proves the Next.js process can answer requests; it intentionally makes
 * no claim about external provider readiness or credentials.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "AI Engineering Platform",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
}
