import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensureUserAndGetId } from "@/lib/ensure-user";
import { dbEnvError } from "@/lib/prisma";
import { AUTH_TIMEOUT_MS, DB_TIMEOUT_MS, withTimeout } from "@/lib/server-timeout";
import { apiError } from "@/lib/server-auth";

async function getAuthOr401() {
  // Env DB belum diisi → throw cepat (<100ms), bukan 401 yang menyesatkan.
  const envErr = dbEnvError();
  if (envErr) throw new Error(envErr);

  const supabase = await createClient();
  // Auth > 4 dtk → throw 503 (bukan null → 401). Avatar tampil di client TIDAK
  // berarti cookie sesi kebaca server — 401 di sini dulu menutupi DB/auth hang.
  const got = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS, "Verifikasi sesi Supabase");
  const { data: { user }, error } = got;
  if (error || !user || !user.email) return null;
  try {
    const dbId = await withTimeout(ensureUserAndGetId(user as any), DB_TIMEOUT_MS, "Koneksi database");
    return { authUser: user, dbId };
  } catch (e) {
    // DB gagal TAPI sesi auth valid → tetap kembalikan info auth (nama dari
    // metadata) + flag dbError, agar client bisa bedakan "belum login" (401)
    // vs "login OK tapi database unreachable" (200 + dbError / 503).
    console.error("[profile] ensureUser failed (auth OK, DB gagal):", e);
    return { authUser: user, dbId: null as string | null, dbError: (e as any)?.message || String(e) };
  }
}

export async function GET() {
  try {
    const ctx = await getAuthOr401();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { authUser, dbId } = ctx;
    let row: any = null;
    if (dbId) {
      try {
        row = await withTimeout(
          prisma.user.findUnique({ where: { id: dbId } }),
          DB_TIMEOUT_MS,
          "Memuat profil"
        );
      } catch {}
    }
    const meta: any = (authUser.user_metadata as any) || {};
    return NextResponse.json({
      id: authUser.id,
      email: authUser.email,
      name: row?.name || meta.display_name || meta.name || meta.full_name || null,
      avatarUrl: null,
      ...((ctx as any).dbError ? { dbError: (ctx as any).dbError } : {}),
    });
  } catch (e: any) {
    return apiError(e, "profile GET");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await getAuthOr401();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { authUser, dbId } = ctx;
    // Sesi auth valid tapi DB unreachable (dbId null) → 503 jelas, bukan update
    // dengan id null yang melempar Prisma error misterius.
    if (!dbId) {
      return NextResponse.json(
        { error: (ctx as any).dbError || "Koneksi database gagal — coba lagi" },
        { status: 503 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 30) : undefined;

    if (name !== undefined && name.length === 0) {
      return NextResponse.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
    }

    let updated: any = null;
    if (name !== undefined) {
      try {
        updated = await withTimeout(
          prisma.user.update({ where: { id: dbId }, data: { name } }),
          DB_TIMEOUT_MS,
          "Menyimpan profil"
        );
      } catch {
        updated = null;
      }
      try {
        const supabase = await createClient();
        await supabase.auth.updateUser({ data: { display_name: name, name } }).catch(() => {});
      } catch {}
    }

    return NextResponse.json({
      id: authUser.id,
      email: authUser.email,
      name: updated?.name ?? name ?? null,
      avatarUrl: null,
    });
  } catch (e: any) {
    return apiError(e, "profile PATCH");
  }
}
