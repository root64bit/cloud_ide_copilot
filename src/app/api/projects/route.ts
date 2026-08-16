import { ProjectService } from "@/server/services/project.service";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId") || "00000000-0000-0000-0000-000000000001";
    const userId = "user_owner"; // In production, retrieved from auth session cookies

    const projects = await ProjectService.listProjects(userId, orgId);
    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to list projects" },
      { status: error?.statusCode || 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = "user_owner";

    const project = await ProjectService.createProject(userId, body);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create project" },
      { status: error?.statusCode || 500 }
    );
  }
}
