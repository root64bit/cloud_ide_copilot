import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { GitHubAppProvider } from "@/server/providers/git/github.provider";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseInstallationId(value: string | null): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid GitHub installation_id");
  return id;
}

export async function GET(req: NextRequest) {
  try {
    await getAuthenticatedUser(req);
    const installationId = parseInstallationId(req.nextUrl.searchParams.get("installation_id"));
    const gitProvider = new GitHubAppProvider();
    const repos = await gitProvider.listRepositories(installationId);

    const response = NextResponse.redirect(new URL("/?github_installed=true", req.url));
    response.cookies.set("github_installation_id", String(installationId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });
    response.cookies.set("github_installation_repo_count", String(repos.length), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });
    return response;
  } catch (error: any) {
    if (error?.statusCode === 401) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.json({ error: error?.message || "GitHub installation setup failed" }, { status: error?.statusCode || 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await getAuthenticatedUser(req);
    const installationId = parseInstallationId(
      req.cookies.get("github_installation_id")?.value || null
    );
    const repos = await new GitHubAppProvider().listRepositories(installationId);
    return NextResponse.json({ success: true, installationId, repositories: repos });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to list GitHub installation repositories" }, { status: error?.statusCode || 500 });
  }
}
