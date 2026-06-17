import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser (client component) singleton — safe to import in "use client" files.
// No next/headers here — this file must remain client-safe.
export const supabase = createBrowserClient(url, anon);
