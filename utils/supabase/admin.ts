import { createClient } from "@supabase/supabase-js";

// Må kun bruges i serverkode (fx i app/api). Nøglen må aldrig sendes til browseren.
export function opretAdminKlient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const noegle = process.env.SUPABASE_SECRET_KEY;
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