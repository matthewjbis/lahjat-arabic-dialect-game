#!/usr/bin/env node
/*
  Backfill submissions.duration_seconds for rows where it's null.

  For each submission missing a duration, this signs a URL to its file in the
  `clip-submissions` bucket, downloads it, reads the media duration from the
  container metadata (no ffmpeg needed), and writes it back.

  Usage:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-durations.mjs [--dry]

  Reads NEXT_PUBLIC_SUPABASE_URL as a fallback for the URL.
  --dry  prints what it would do without writing.
*/
import { createClient } from "@supabase/supabase-js";
import { parseBuffer } from "music-metadata";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes("--dry");
const BUCKET = "clip-submissions";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing env. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const { data: rows, error } = await db
  .from("submissions")
  .select("id, file_path, file_type")
  .is("duration_seconds", null);

if (error) {
  console.error("Query failed:", error.message);
  process.exit(1);
}

console.log(`${rows.length} submission(s) missing duration_seconds.${DRY ? " (dry run)" : ""}`);

let updated = 0;
const failures = [];

for (const row of rows) {
  try {
    const { data: signed, error: signErr } = await db.storage
      .from(BUCKET)
      .createSignedUrl(row.file_path, 60 * 10);
    if (signErr || !signed) throw new Error(signErr?.message ?? "no signed URL");

    const res = await fetch(signed.signedUrl);
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());

    const { format } = await parseBuffer(
      buf,
      { mimeType: row.file_type, size: buf.length },
      { duration: true }
    );
    const seconds = format.duration;
    if (!Number.isFinite(seconds) || seconds <= 0) {
      throw new Error("could not read duration");
    }
    const rounded = Math.round(seconds);

    if (DRY) {
      console.log(`  would set ${row.id} (${row.file_path}) -> ${rounded}s`);
    } else {
      const { error: upErr } = await db
        .from("submissions")
        .update({ duration_seconds: rounded })
        .eq("id", row.id);
      if (upErr) throw new Error(upErr.message);
      console.log(`  ✓ ${row.id} (${row.file_path}) -> ${rounded}s`);
    }
    updated++;
  } catch (e) {
    console.warn(`  ✗ ${row.id} (${row.file_path}): ${e.message}`);
    failures.push({ id: row.id, file_path: row.file_path, reason: e.message });
  }
}

console.log(
  `\nDone. ${DRY ? "Would update" : "Updated"} ${updated}/${rows.length}.` +
    (failures.length ? ` ${failures.length} failed.` : "")
);
