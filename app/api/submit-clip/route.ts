import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, createServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const file = formData.get("file") as File | null;
  const city = (formData.get("city") as string | null)?.trim() || null;
  const country = (formData.get("country") as string | null)?.trim();
  const name = (formData.get("name") as string | null)?.trim() || null;
  const sourceType = (formData.get("source_type") as string | null) ?? "upload";

  if (!file || !country) {
    return NextResponse.json(
      { error: "file and country are required" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only audio and video files are accepted" },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File must be under 50 MB" },
      { status: 400 }
    );
  }

  // Attribute the submission to the signed-in user, if any (null for anonymous)
  const authClient = await createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();

  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("clip-submissions")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("Storage upload failed:", uploadError);
    return NextResponse.json(
      { error: "Upload failed, please try again" },
      { status: 500 }
    );
  }

  const { error: dbError } = await supabaseAdmin.from("submissions").insert({
    city,
    country,
    name,
    file_path: path,
    file_type: file.type,
    source_type: sourceType,
    status: "pending",
    user_id: user?.id ?? null,
  });

  if (dbError) {
    console.error("DB insert failed:", dbError);
    return NextResponse.json(
      { error: "Submission failed, please try again" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
