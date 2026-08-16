import { verifyGitHubSignature } from "@/lib/security/signature";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");
    const event = req.headers.get("x-github-event");
    const secret = process.env.GITHUB_APP_WEBHOOK_SECRET;

    // Validate X-Hub-Signature-256 using HMAC-SHA256 against the raw request body
    if (secret) {
      const isValid = verifyGitHubSignature(rawBody, signature, secret);
      if (!isValid) {
        console.error(`[GitHub Webhook] Unauthorized: Invalid or missing X-Hub-Signature-256 for event '${event}'`);
        return NextResponse.json(
          { error: "Invalid or missing GitHub webhook signature" },
          { status: 401 }
        );
      }
    } else if (process.env.NODE_ENV === "production") {
      console.error("[GitHub Webhook] Unauthorized: GITHUB_APP_WEBHOOK_SECRET is not configured in production");
      return NextResponse.json(
        { error: "Webhook secret is not configured" },
        { status: 500 }
      );
    }

    const payload = JSON.parse(rawBody || "{}");
    const action = payload.action;

    console.log(`[GitHub Webhook] Received event: ${event}${action ? `, action: ${action}` : ""}`);

    // Handle supported events
    switch (event) {
      case "installation": {
        const installationId = payload.installation?.id;
        const account = payload.installation?.account?.login;
        console.log(
          `[GitHub Webhook] Installation event '${action}' for account '${account}' (ID: ${installationId})`
        );
        break;
      }

      case "installation_repositories": {
        const installationId = payload.installation?.id;
        const added = payload.repositories_added?.map((r: any) => r.full_name) || [];
        const removed = payload.repositories_removed?.map((r: any) => r.full_name) || [];
        console.log(
          `[GitHub Webhook] Installation repositories event for ID ${installationId}: +${added.length} repos, -${removed.length} repos`
        );
        break;
      }

      case "push": {
        const ref = payload.ref;
        const repo = payload.repository?.full_name;
        const commitsCount = payload.commits?.length || 0;
        console.log(`[GitHub Webhook] Push to ${repo} on ref ${ref} (${commitsCount} commits)`);
        break;
      }

      case "pull_request": {
        const prNumber = payload.pull_request?.number;
        const repo = payload.repository?.full_name;
        const headRef = payload.pull_request?.head?.ref;
        const baseRef = payload.pull_request?.base?.ref;
        console.log(
          `[GitHub Webhook] Pull Request #${prNumber} ${action} on ${repo} (${headRef} -> ${baseRef})`
        );
        break;
      }

      case "check_run": {
        const checkName = payload.check_run?.name;
        const status = payload.check_run?.status;
        const conclusion = payload.check_run?.conclusion;
        console.log(`[GitHub Webhook] Check run '${checkName}': ${status} (conclusion: ${conclusion || "pending"})`);
        break;
      }

      case "check_suite": {
        const status = payload.check_suite?.status;
        const conclusion = payload.check_suite?.conclusion;
        console.log(`[GitHub Webhook] Check suite: ${status} (conclusion: ${conclusion || "pending"})`);
        break;
      }

      case "status": {
        const state = payload.state;
        const context = payload.context;
        const sha = payload.sha?.substring(0, 7);
        console.log(`[GitHub Webhook] Commit status for ${sha} [${context}]: ${state}`);
        break;
      }

      case "workflow_run": {
        const workflowName = payload.workflow?.name;
        const status = payload.workflow_run?.status;
        const conclusion = payload.workflow_run?.conclusion;
        console.log(
          `[GitHub Webhook] Workflow run '${workflowName}': ${status} (conclusion: ${conclusion || "pending"})`
        );
        break;
      }

      case "ping": {
        console.log(`[GitHub Webhook] Ping received from GitHub App: ${payload.zen || "OK"}`);
        break;
      }

      default:
        console.log(`[GitHub Webhook] Unhandled event type: ${event}`);
    }

    return NextResponse.json(
      {
        received: true,
        event,
        action: action || null,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GitHub Webhook] Processing error:", error);
    return NextResponse.json(
      { error: error?.message || "Webhook processing error" },
      { status: 400 }
    );
  }
}
