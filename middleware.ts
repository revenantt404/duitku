import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const isPlaceholder = !url || url.includes("placeholder") || key === "placeholder" || url.includes("localhost");

  // Mode demo / belum config Supabase → jangan block, biar dashboard demo tetap kebuka
  if (isPlaceholder) return NextResponse.next();

  const { updateSession } = await import("./lib/supabase/middleware");
  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
