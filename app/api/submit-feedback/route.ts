import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  let userId: string | null = null;
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {}

  const { error } = await supabaseAdmin.from("general_feedback").insert({
    message: message.slice(0, 5000),
    user_id: userId,
  });

  if (error) {
    console.error("[lahjat] feedback insert error:", error.message);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
