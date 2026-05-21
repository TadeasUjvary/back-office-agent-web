/**
 * Supabase clients — browser (anon) and server (service-role).
 *
 * Browser uses the publishable/anon key (safe in client bundle).
 * Server uses the service-role key (NEVER expose to client) — used in API
 * route handlers and server components for unrestricted DB access.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

/** Browser-safe client (anon key). Use only in 'use client' code. */
export function getBrowserSupabase(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
  }
  return browserClient;
}

/** Server-only client (service-role). Bypasses RLS. */
export function getServerSupabase(): SupabaseClient {
  if (!serverClient) {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
    }
    serverClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serverClient;
}
