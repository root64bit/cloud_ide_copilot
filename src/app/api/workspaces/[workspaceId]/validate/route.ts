import { VercelSandboxProvider } from "@/server/providers/sandbox/vercel-sandbox.provider";
import { ValidationService } from "@/server/services/validation.service";
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

    const sandboxProvider = new VercelSandboxProvider();
    const validationResult = await ValidationService.runValidationPipeline(
      userId,
      organizationId,
      workspaceId,
      sandboxProvider
    );

    return NextResponse.json({ validationResult });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to run validation pipeline" },
      { status: error?.statusCode || 500 }
    );
  }
}
