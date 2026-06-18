import { NextResponse } from "next/server";
import { supabaseAdmin, createServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

// Returns the number of clips the signed-in user has contributed.
// Counts server-side with the admin client so it works regardless of the
// submissions table's RLS configuration.
export async function GET() {
  const authClient = await createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { count, error } = await supabaseAdmin
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to count contributions:", error.message);
    return NextResponse.json({ error: "Failed to load contributions" }, { status: 500 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
