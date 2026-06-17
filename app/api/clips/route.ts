import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveLocation } from "@/lib/resolveLocation";
import type { Clip } from "@/lib/scoring";

export const runtime = "nodejs";

export async function GET() {
  const { data: submissions, error } = await supabaseAdmin
    .from("submissions")
    .select("id, file_path, file_type, country, city")
    .eq("status", "approved");

  if (error) {
    console.error("[lahjat] clips fetch error:", error.message);
    return NextResponse.json({ error: "Failed to load clips" }, { status: 500 });
  }

  const filePaths = (submissions ?? []).map((s) => s.file_path);
  const { data: signedEntries } = filePaths.length
    ? await supabaseAdmin.storage
        .from("clip-submissions")
        .createSignedUrls(filePaths, 60 * 60)
    : { data: [] };

  const signedUrlMap = Object.fromEntries(
    (signedEntries ?? []).map((e) => [e.path, e.signedUrl])
  );

  const clips: Clip[] = (submissions ?? []).flatMap((s) => {
    const location = resolveLocation(s.city ?? null, s.country);
    if (!location) return [];

    const audioUrl = signedUrlMap[s.file_path];
    if (!audioUrl) return [];

    return [
      {
        id: `sub-${s.id}`,
        source: "upload",
        youtube_id: "",
        audio_url: audioUrl,
        media_type: s.file_type,
        start_seconds: 0,
        label_provided: location.cluster,
        answer: {
          city: location.name,
          country: location.country,
          cluster: location.cluster,
          macro_group: location.macro_group,
          lat: location.lat,
          lon: location.lon,
          city_confidence: s.city ? undefined : "country",
        },
        alternate_acceptable_clusters: [],
        verification_status: "approved",
        notes: "",
        reveal_draft: "",
      },
    ];
  });

  return NextResponse.json(clips);
}
