import { verifyGitHubSignature } from "@/lib/security/signature";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");
    const event = req.headers.get("x-github-event");
    const secret = process.env.GITHUB_APP_WEBHOOK_SECRET || "mock-github-secret";

    const isValid = verifyGitHubSignature(rawBody, signature, secret);
    if (!isValid && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Invalid GitHub webhook signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody || "{}");

    // Handle installation or pull_request events
    console.log(`[GitHub Webhook] Received event: ${event}, action: ${payload.action}`);

    return NextResponse.json({ received: true, event }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Webhook processing error" },
      { status: 400 }
    );
  }
}
