import { VercelSandboxProvider } from "@/server/providers/sandbox/vercel-sandbox.provider";
import { WorkspaceService } from "@/server/services/workspace.service";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const body = await req.json();
    const userId = "user_engineer";
    const organizationId = body.organizationId || "00000000-0000-0000-0000-000000000001";
    const commandType = body.commandType || "test";
    const customCommandString = body.customCommandString;

    const sandboxProvider = new VercelSandboxProvider();
    const commandRun = await WorkspaceService.executeCommand(
      userId,
      organizationId,
      workspaceId,
      sandboxProvider,
      commandType,
      customCommandString
    );

    return NextResponse.json({ commandRun });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to execute command" },
      { status: error?.statusCode || 500 }
    );
  }
}
