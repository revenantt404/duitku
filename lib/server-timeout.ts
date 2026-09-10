/**
 * Timeout helper untuk route API server.
 *
 * Konteks bug produksi (Vercel): tiap route memanggil `supabase.auth.getUser()`
 * lalu query Prisma TANPA batas waktu yang selaras dengan client. Kalau Supabase
 * Auth lambat atau koneksi Postgres (DATABASE_URL/DIRECT_URL) gantung, request
 * ngegantung sampai client abort di 12 dtk (`API_TIMEOUT_MS` di lib/api.ts) →
 * dashboard infinite loading tanpa pesan yang jelas.
 *
 * Budget waktu per request (total worst-case < API_TIMEOUT_MS 12 dtk client):
 * - AUTH_TIMEOUT_MS = 4 dtk untuk verifikasi sesi Supabase.
 * - DB_TIMEOUT_MS = 3 dtk per tahap query Prisma (ensureUser, lalu query utama).
 * Worst-case GET: 4 + 3 + 3 = 10 dtk → server SELALU sempat menjawab
 * 500/503 + pesan jelas sebelum client abort.
 */

export const AUTH_TIMEOUT_MS = 4_000;
export const DB_TIMEOUT_MS = 3_000;

const ENV_HINT =
  "Kemungkinan koneksi database/Supabase lambat — cek di Vercel Dashboard: " +
  "DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY " +
  "(+ pastikan project Supabase tidak paused).";

export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timeout setelah ${(ms / 1000).toString().replace(".", ",")} dtk. ${ENV_HINT}`));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
