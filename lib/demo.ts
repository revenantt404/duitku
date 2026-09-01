export function isDemoMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return true;
  if (url.includes("placeholder") || key === "placeholder") return true;
  if (url.includes("localhost")) return true;
  return false;
}

// Client-side check (pakai NEXT_PUBLIC_ jadi bisa di browser)
export function isDemoModeClient(): boolean {
  if (typeof window === "undefined") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return true;
  if (url.includes("placeholder") || key === "placeholder") return true;
  if (url.includes("localhost")) return true;
  // juga cek flag localStorage
  try {
    if (localStorage.getItem("duitku_demo_user")) return true;
  } catch {}
  return false;
}
