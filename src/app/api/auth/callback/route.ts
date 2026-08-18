import { createServerAuthClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/onboarding";

  if (code) {
    try {
      const supabase = await createServerAuthClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
    } catch (err) {
      console.error("[Auth Callback Error]", err);
    }
  }

  // Redirect to home/login if code is missing or exchange fails
  return NextResponse.redirect(new URL("/login?error=Confirmation+link+expired+or+already+used", requestUrl.origin));
}
