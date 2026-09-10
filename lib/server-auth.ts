import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserAndGetId } from "@/lib/ensure-user";
import { dbEnvError } from "@/lib/prisma";
import { AUTH_TIMEOUT_MS, DB_TIMEOUT_MS, withTimeout } from "@/lib/server-timeout";

/**
 * Verifikasi sesi + resolve userId DB dengan budget waktu ketat.
 *
 * Konteks bug produksi: tiap route API memanggil `supabase.auth.getUser()`
 * lalu `ensureUserAndGetId()` TANPA timeout. Kalau Auth lambat / koneksi
 * Postgres gantung (DATABASE_URL salah, pool habis, project ke-pause),
 * request ngegantung sampai client abort di 12 dtk → skeleton infinite.
 *
 * - Env DB belum diisi → throw cepat (<100ms) dengan pesan jelas.
 * - Auth > 4 dtk → throw 503 (bukan 401 yang menyesatkan).
 * - DB > 3 dtk per tahap → throw 503 + hint env yang harus dicek.
 * Return null HANYA kalau sesi benar-benar tidak ada (user belum login).
 */
export async function requireUserId(): Promise<string | null> {
  const envErr = dbEnvError();
  if (envErr) throw new Error(envErr);

  const supabase = await createClient();
  const got = await withTimeout(
    supabase.auth.getUser(),
    AUTH_TIMEOUT_MS,
    "Verifikasi sesi Supabase"
  );
  const {
    data: { user },
    error,
  } = got;
  if (error || !user || !user.email) return null;
  return await withTimeout(
    ensureUserAndGetId(user as any),
    DB_TIMEOUT_MS,
    "Koneksi database"
  );
}

/**
 * Bungkus catch route API: error timeout/env → 503 (retryable),
 * sisanya 500 seperti sebelumnya. Pesan selalu jelas, tidak menggantung.
 */
export function apiError(e: any, tag: string) {
  console.error(`[${tag}] failed:`, e);
  const msg = e?.message || String(e);
  const transient = /timeout|lambat|belum dikonfigurasi/i.test(msg);
  return NextResponse.json(
    { error: msg, code: e?.code },
    { status: transient ? 503 : 500 }
  );
}
