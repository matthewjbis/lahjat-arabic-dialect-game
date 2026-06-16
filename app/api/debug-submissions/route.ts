import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("submissions")
    .select("id, status, country, city, file_type");

  return NextResponse.json({
    error: error?.message ?? null,
    count: data?.length ?? 0,
    rows: data ?? [],
    env: {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
}
