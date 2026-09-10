import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  // Fallback placeholder biar gak throw saat env belum diisi (mode demo).
  // Root middleware.ts sudah guard isPlaceholder sebelum updateSession dipanggil.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options as any));
        },
      },
    }
  );
  // Timeout: sesi Supabase lambat (cold start) tidak boleh menggantung navigasi —
  // lewat 8 dtk, lewatkan request (fail-open); page + watchdog yang handle recovery.
  let user: any = null;
  try {
    const got: any = await Promise.race([
      supabase.auth.getUser(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8_000)),
    ]);
    if (got === null) return supabaseResponse;
    user = got?.data?.user ?? null;
  } catch {
    user = null;
  }
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  const isProtected =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/transaksi") ||
    request.nextUrl.pathname.startsWith("/dompet") ||
    request.nextUrl.pathname.startsWith("/anggaran") ||
    request.nextUrl.pathname.startsWith("/tujuan");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  return supabaseResponse;
}
