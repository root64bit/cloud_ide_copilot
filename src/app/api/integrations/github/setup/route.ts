import { GitHubAppProvider } from "@/server/providers/git/github.provider";
import { NextRequest, NextResponse } from "next/server";

/**
 * GitHub App Setup Callback Route
 *
 * Handles redirects from GitHub after a user installs or modifies permissions
 * for the GitHub App.
 *
 * Query Params provided by GitHub:
 * - `installation_id`: The ID of the app installation
 * - `setup_action`: "install" | "update" | "request"
 * - `state`: Optional state parameter for CSRF / org mapping
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const installationIdStr = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action") || "install";
  const state = searchParams.get("state");

  if (!installationIdStr) {
    const errorMsg = "Missing required 'installation_id' query parameter from GitHub setup redirect.";
    console.error(`[GitHub Setup] Error: ${errorMsg}`);
    
    // Check if client expects JSON
    if (req.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(errorMsg)}`, req.url));
  }

  const installationId = parseInt(installationIdStr, 10);
  if (isNaN(installationId) || installationId <= 0) {
    const errorMsg = `Invalid installation_id: ${installationIdStr}`;
    console.error(`[GitHub Setup] Error: ${errorMsg}`);
    
    if (req.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(errorMsg)}`, req.url));
  }

  console.log(
    `[GitHub Setup] Successfully received installation callback. Installation ID: ${installationId}, Action: ${setupAction}`
  );

  let repositoryCount = 0;
  let accessibleRepos: string[] = [];

  try {
    const gitProvider = new GitHubAppProvider();
    const repos = await gitProvider.listRepositories(installationId);
    repositoryCount = repos.length;
    accessibleRepos = repos.map((r) => r.fullName);
    console.log(
      `[GitHub Setup] Verified installation ID ${installationId}: ${repositoryCount} repositories accessible.`
    );
  } catch (err: any) {
    console.warn(
      `[GitHub Setup] Warning: Could not list repositories for installation ID ${installationId} during setup: ${err?.message}`
    );
  }

  // If requested via JSON API
  if (req.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({
      success: true,
      installationId,
      setupAction,
      repositoryCount,
      repositories: accessibleRepos,
    });
  }

  // Redirect to dashboard with installation details
  const targetUrl = new URL(
    `/default/settings?github_installed=true&installation_id=${installationId}&repos=${repositoryCount}`,
    req.url
  );
  return NextResponse.redirect(targetUrl);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const installationId = body.installationId || body.installation_id;

    if (!installationId) {
      return NextResponse.json(
        { error: "Missing required 'installationId' parameter" },
        { status: 400 }
      );
    }

    const gitProvider = new GitHubAppProvider();
    const repos = await gitProvider.listRepositories(Number(installationId));

    return NextResponse.json({
      success: true,
      installationId: Number(installationId),
      repositories: repos,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process GitHub installation setup" },
      { status: 500 }
    );
  }
}
