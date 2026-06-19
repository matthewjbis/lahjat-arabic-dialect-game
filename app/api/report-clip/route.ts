import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

const VALID_REASONS = [
  "wrong_dialect",
  "wrong_city",
  "poor_quality",
  "other",
] as const;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.clip_id || !body?.reason) {
    return NextResponse.json({ error: "Missing clip_id or reason" }, { status: 400 });
  }
  if (!VALID_REASONS.includes(body.reason)) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const note = typeof body.note === "string" ? body.note.slice(0, 1000) : null;

  // Best-effort: attach user_id if logged in
  let userId: string | null = null;
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {}

  const { error } = await supabaseAdmin.from("clip_reports").insert({
    clip_id: String(body.clip_id).slice(0, 100),
    reason: body.reason,
    note,
    user_id: userId,
  });

  if (error) {
    console.error("[lahjat] clip report insert error:", error.message);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
