import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Browser (client component) singleton — identical API to the old createClient
export const supabase = createBrowserClient(url, anon);

// Server-side client — reads/writes session cookies; call inside server components
// and route handlers. async because cookies() is async in Next.js 15+.
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll is called from middleware where the response can't be mutated —
          // the middleware itself handles the cookie write, so this is safe to swallow.
        }
      },
    },
  });
}

// Admin client — service role, server-only. Never import in client components.
export const supabaseAdmin = createClient(url, service);
