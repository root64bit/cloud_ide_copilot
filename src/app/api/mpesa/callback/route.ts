import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}));
    console.log("[M-Pesa Callback Received]", JSON.stringify(payload, null, 2));

    // Acknowledge receipt of the webhook from M-Pesa Vodacom Gateway
    return NextResponse.json({
      received: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { received: false, error: error?.message || "Callback processing error" },
      { status: 500 }
    );
  }
}
