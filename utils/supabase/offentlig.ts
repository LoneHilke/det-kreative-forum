import { createClient } from "@supabase/supabase-js";

// Til data, som alle må se (fx kategorier). Bruger ingen cookies og intet login.
export function opretOffentligKlient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const noegle = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !noegle) {
    throw new Error("Supabase-opsætning mangler");
  }
  return createClient(url, noegle, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}