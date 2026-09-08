import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Fallback placeholder biar gak throw saat env belum diisi (mode demo).
  // Pengecekan demo (isPlaceholder / isDemoMode) tetap jalan via env aslinya.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
  return createBrowserClient(url, key);
}
