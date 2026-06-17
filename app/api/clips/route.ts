import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { resolveLocation } from "@/lib/resolveLocation";
import type { Clip } from "@/lib/scoring";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const debug = req.nextUrl.searchParams.get("debug") === "1";

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

  type DropInfo = { id: string; country: string; city: string | null; file_path: string; reason: string };
  const dropped: DropInfo[] = [];
  const clips: Clip[] = (submissions ?? []).flatMap((s) => {
    const location = resolveLocation(s.city ?? null, s.country);
    if (!location) {
      const msg = `no city match (city="${s.city ?? ""}" country="${s.country}")`;
      console.warn(`[lahjat] drop id=${s.id}: ${msg}`);
      dropped.push({ id: s.id, country: s.country, city: s.city ?? null, file_path: s.file_path, reason: msg });
      return [];
    }

    const audioUrl = signedUrlMap[s.file_path];
    if (!audioUrl) {
      const msg = `no signed URL (path="${s.file_path}" — file may be missing from storage)`;
      console.warn(`[lahjat] drop id=${s.id}: ${msg}`);
      dropped.push({ id: s.id, country: s.country, city: s.city ?? null, file_path: s.file_path, reason: msg });
      return [];
    }

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

  console.log(`[lahjat] serving ${clips.length}/${(submissions ?? []).length} approved clips`);

  if (debug) {
    return NextResponse.json({
      total: (submissions ?? []).length,
      serving: clips.length,
      dropped,
      clips,
    });
  }

  return NextResponse.json(clips);
}
