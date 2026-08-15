import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Client Supabase folosit DOAR pe server (server components / server actions).
 * Folosește service role key — NU expune niciodată acest client sau cheia
 * către browser.
 */
export function supabaseServer(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Lipsesc variabilele de mediu SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. " +
        "Vezi README pentru configurare."
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
