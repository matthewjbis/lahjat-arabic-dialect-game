import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, createServerSupabase } from "@/lib/supabase-server";

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

// Accepts metadata only — no binary payload.
// Returns a Supabase pre-signed upload URL so the client can upload
// the file directly to storage, bypassing Vercel's request size limits.
export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const filetype = (formData.get("filetype") as string | null)?.trim();
  const filename = (formData.get("filename") as string | null)?.trim() ?? "upload";
  const city = (formData.get("city") as string | null)?.trim() || null;
  const country = (formData.get("country") as string | null)?.trim();
  const name = (formData.get("name") as string | null)?.trim() || null;
  const sourceType = (formData.get("source_type") as string | null) ?? "upload";

  if (!filetype || !country) {
    return NextResponse.json(
      { error: "filetype and country are required" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.has(filetype)) {
    return NextResponse.json(
      { error: "Only audio and video files are accepted" },
      { status: 400 }
    );
  }

  const authClient = await createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to submit a clip" },
      { status: 401 }
    );
  }

  const ext = filename.split(".").pop() ?? "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data: signedData, error: signedError } = await supabaseAdmin.storage
    .from("clip-submissions")
    .createSignedUploadUrl(path);

  if (signedError || !signedData) {
    console.error("Failed to create signed upload URL:", signedError);
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
    file_type: filetype,
    source_type: sourceType,
    status: "pending",
    user_id: user.id,
  });

  if (dbError) {
    console.error("DB insert failed:", dbError);
    return NextResponse.json(
      { error: "Submission failed, please try again" },
      { status: 500 }
    );
  }

  return NextResponse.json({ signedUrl: signedData.signedUrl, token: signedData.token, path });
}
