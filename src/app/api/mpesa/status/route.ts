import { NextResponse } from "next/server";

const MINESCOPE_STATUS_URL = "https://minescoop-mz.web.app/api/mpesa/status";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { queryRef, thirdPartyRef } = body;

    if (!queryRef || !thirdPartyRef) {
      return NextResponse.json(
        { success: false, error: "queryRef and thirdPartyRef are required" },
        { status: 400 }
      );
    }

    const payload = {
      queryRef: String(queryRef),
      thirdPartyRef: String(thirdPartyRef),
    };

    const upstreamResponse = await fetch(MINESCOPE_STATUS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await upstreamResponse.json();

    return NextResponse.json(result, { status: upstreamResponse.ok ? 200 : upstreamResponse.status });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to query M-Pesa status",
      },
      { status: 500 }
    );
  }
}
