#!/usr/bin/env node
/*
  Backfill submissions.duration_seconds for rows where it's null.

  For each submission missing a duration, this signs a URL to its file in the
  `clip-submissions` bucket, downloads it, reads the media duration from the
  container metadata (no ffmpeg needed), and writes it back.

  Uses the Supabase REST + Storage HTTP APIs directly (Node 20-friendly; no
  supabase-js realtime/WebSocket dependency).

  Usage:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-durations.mjs [--dry]

  Reads NEXT_PUBLIC_SUPABASE_URL as a fallback for the URL.
  --dry  prints what it would do without writing.
*/
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

const REST = `${SUPABASE_URL}/rest/v1`;
const STORAGE = `${SUPABASE_URL}/storage/v1`;
const authHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

// 1. Rows missing a duration
const listRes = await fetch(
  `${REST}/submissions?select=id,file_path,file_type&duration_seconds=is.null`,
  { headers: authHeaders }
);
if (!listRes.ok) {
  console.error(`Query failed: HTTP ${listRes.status} ${await listRes.text()}`);
  process.exit(1);
}
const rows = await listRes.json();
console.log(
  `${rows.length} submission(s) missing duration_seconds.${DRY ? " (dry run)" : ""}`
);

let updated = 0;
const failures = [];

for (const row of rows) {
  try {
    // 2. Signed download URL for the stored file
    const signRes = await fetch(
      `${STORAGE}/object/sign/${BUCKET}/${encodeURIComponent(row.file_path)}`,
      {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ expiresIn: 600 }),
      }
    );
    if (!signRes.ok) throw new Error(`sign HTTP ${signRes.status}`);
    const { signedURL } = await signRes.json();

    // 3. Download + read duration from container metadata
    const fileRes = await fetch(`${STORAGE}${signedURL}`);
    if (!fileRes.ok) throw new Error(`download HTTP ${fileRes.status}`);
    const buf = Buffer.from(await fileRes.arrayBuffer());

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

    // 4. Write back
    if (DRY) {
      console.log(`  would set ${row.id} (${row.file_path}) -> ${rounded}s`);
    } else {
      const upRes = await fetch(`${REST}/submissions?id=eq.${row.id}`, {
        method: "PATCH",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ duration_seconds: rounded }),
      });
      if (!upRes.ok) throw new Error(`update HTTP ${upRes.status}`);
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
