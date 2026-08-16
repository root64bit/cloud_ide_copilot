import { MockGitProvider } from "@/server/providers/git/mock.provider";
import { GitPrService } from "@/server/services/git-pr.service";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const body = await req.json();
    const userId = body.userId || "user_owner"; // Requires Owner or Admin
    const organizationId = body.organizationId || "00000000-0000-0000-0000-000000000001";
    const approvalNotes = body.approvalNotes || "Human approved for production merge";

    const gitProvider = new MockGitProvider();
    const result = await GitPrService.approveAndMerge(
      userId,
      organizationId,
      workspaceId,
      gitProvider,
      approvalNotes
    );

    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to approve and merge repair" },
      { status: error?.statusCode || 500 }
    );
  }
}
