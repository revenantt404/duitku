import { prisma } from "@/lib/prisma";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

/**
 * Pastikan baris User ada di DB dan kembalikan `userId` yang HARUS dipakai
 * untuk FK Wallet/Category/Transaction/dll.
 *
 * Kenapa helper ini ada:
 * - Dulu semua route pakai `upsert({ where: { email } })` dengan `create: { id: authId }`.
 *   Kalau baris lama sudah ada dengan `id = cuid()` (seed/manual) dan email sama,
 *   upsert masuk jalur `update` — `id` tetap cuid lama. Tapi route tetap `return authId`
 *   → `prisma.wallet.create({ userId: authId })` FK violation `Wallet_userId_fkey`.
 * - Ada juga kasus `prisma.user.upsert(...).catch(()=>{})` yang ngebiarin upsert gagal
 *   diam-diam (mis. DATABASE_URL miss / P2002 duplicate email) lalu tetap return authId.
 *
 * Helper ini selalu return ID yang beneran ada di `User`:
 *  1. Coba `findUnique({ id: authId })` → kalau ketemu, sync email/name/avatar lalu return authId.
 *  2. Kalau tidak ketemu by id, cek `findUnique({ email })`:
 *     - Kalau ketemu row lama (id != authId):
 *       * kalau row lama belum punya data (0 wallet/tx/cat/budget/goal) → aman hapus & buat ulang
 *         dengan `id = authId` biar selanjutnya konsisten dengan Supabase.
 *       * kalau sudah punya data → REUSE id lama biar FK tidak putus, update name/avatar saja.
 *  3. Kalau tidak ketemu sama sekali → `create({ id: authId })`.
 *  4. Race P2002 saat create → fallback `findUnique({ email })`.
 */
export async function ensureUserAndGetId(authUser: SupabaseAuthUser): Promise<string> {
  const email = authUser.email;
  if (!email) throw new Error("User email missing dari Supabase");

  const meta: any = (authUser as any).user_metadata || {};
  const name: string | null = meta.name ?? meta.display_name ?? meta.full_name ?? null;
  const avatarUrl: string | null = meta.avatar_url ?? null;

  // 1) Fast path: sudah ada baris dengan id = authId ?
  try {
    const byId = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (byId) {
      const needUpdate =
        byId.email !== email ||
        (name !== null && byId.name !== name) ||
        (avatarUrl !== null && byId.avatarUrl !== avatarUrl);
      if (needUpdate) {
        try {
          await prisma.user.update({
            where: { id: authUser.id },
            data: {
              email,
              ...(name !== null ? { name } : {}),
              ...(avatarUrl !== null ? { avatarUrl } : {}),
            },
          });
        } catch (e: any) {
          // P2002 = email sudah dipakai row lain (row lama cuid). Jangan update email, update name/avatar aja
          if (e?.code === "P2002") {
            try {
              await prisma.user.update({
                where: { id: authUser.id },
                data: {
                  ...(name !== null ? { name } : {}),
                  ...(avatarUrl !== null ? { avatarUrl } : {}),
                },
              });
            } catch {}
          } else {
            console.error("[ensureUser] update byId failed:", e);
          }
        }
      }
      return authUser.id;
    }
  } catch (e) {
    console.error("[ensureUser] findUnique by id failed:", e);
  }

  // 2) Tidak ada by id → cek by email (row lama cuid)
  try {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      // byEmail.id !== authUser.id → mismatch
      if (byEmail.id !== authUser.id) {
        const [w, t, c, b, g] = await Promise.all([
          prisma.wallet.count({ where: { userId: byEmail.id } }).catch(() => 0),
          prisma.transaction.count({ where: { userId: byEmail.id } }).catch(() => 0),
          prisma.category.count({ where: { userId: byEmail.id } }).catch(() => 0),
          prisma.budget.count({ where: { userId: byEmail.id } }).catch(() => 0),
          prisma.goal.count({ where: { userId: byEmail.id } }).catch(() => 0),
        ]);
        const hasData = w + t + c + b + g > 0;
        if (!hasData) {
          // Aman migrasi: hapus row lama cuid → buat ulang dengan id auth
          try {
            await prisma.user.delete({ where: { id: byEmail.id } });
            await prisma.user.create({ data: { id: authUser.id, email, name, avatarUrl } });
            console.warn(`[ensureUser] Migrated email ${email}: deleted old id ${byEmail.id} → new id ${authUser.id} (no dependent data)`);
            return authUser.id;
          } catch (e) {
            console.error("[ensureUser] migrate delete/create failed, reusing old id:", e);
            return byEmail.id;
          }
        } else {
          // Ada data → jangan putusin FK, reuse id lama
          try {
            await prisma.user.update({
              where: { id: byEmail.id },
              data: { ...(name !== null ? { name } : {}), ...(avatarUrl !== null ? { avatarUrl } : {}) },
            });
          } catch {}
          console.warn(
            `[ensureUser] Reusing existing user id ${byEmail.id} for email ${email} (auth id ${authUser.id}) — preserve ${w} wallets / ${t} tx`
          );
          return byEmail.id;
        }
      }
      // id sama (seharusnya sudah ketemu di byId, tapi fallback)
      return byEmail.id;
    }
  } catch (e) {
    console.error("[ensureUser] findUnique by email failed:", e);
  }

  // 3) Belum ada sama sekali → create baru dengan id = authId
  try {
    await prisma.user.create({ data: { id: authUser.id, email, name, avatarUrl } });
    return authUser.id;
  } catch (e: any) {
    // Race: row dengan email yang sama keburu dibuat request lain
    if (e?.code === "P2002") {
      console.warn("[ensureUser] P2002 on create, fallback to find by email:", e?.meta);
      try {
        const again = await prisma.user.findUnique({ where: { email } });
        if (again) return again.id;
        const byIdAgain = await prisma.user.findUnique({ where: { id: authUser.id } });
        if (byIdAgain) return byIdAgain.id;
      } catch {}
    }
    console.error("[ensureUser] create failed:", e);
    throw e;
  }
}
