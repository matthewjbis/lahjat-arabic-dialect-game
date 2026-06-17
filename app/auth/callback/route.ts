import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

// Handles email confirmation links and OAuth redirects.
// Supabase appends ?code=<code>&next=<path> to the redirect URL.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerSupabase();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
