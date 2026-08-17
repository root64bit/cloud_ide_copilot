import { getAuthenticatedUser } from "@/lib/supabase/auth";
import type { CommandType } from "@/lib/supabase/types";
import { VercelSandboxProvider } from "@/server/providers/sandbox/vercel-sandbox.provider";
import { WorkspaceService } from "@/server/services/workspace.service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const user = await getAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));
    const organizationId = body.organizationId || "00000000-0000-0000-0000-000000000001";
    const commandType = (body.commandType || "test") as CommandType;
    const customCommandString = body.customCommandString;

    const sandboxProvider = new VercelSandboxProvider();
    const commandRun = await WorkspaceService.executeCommand(
      user.id,
      organizationId,
      workspaceId,
      sandboxProvider,
      commandType,
      customCommandString
    );

    return NextResponse.json({
      ok: true,
      commandRun,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Command execution failed" },
      { status: error?.statusCode || 500 }
    );
  }
}
