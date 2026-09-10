import { PrismaClient } from "@prisma/client";

// Fix: NextResponse.json uses JSON.stringify which throws "Do not know how to serialize a BigInt"
// for Wallet.initialBalance / Transaction.amount / Budget.amount / Goal.targetAmount.
// Patch once so any missed spot still serializes as string instead of 500.
if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Cache SELALU (termasuk production): di Vercel serverless, tiap invocation yang
// bikin PrismaClient baru = pool koneksi baru. Dashboard menembak 6 query paralel;
// tanpa cache, koneksi ke Supabase cepat habis → connect timeout → 500/hang.
// globalThis bertahan di warm instance, jadi ini aman & disarankan Prisma.
globalForPrisma.prisma = prisma;

/**
 * Fail-fast check: kalau DATABASE_URL/DIRECT_URL belum diisi di Vercel,
 * kembalikan pesan jelas agar route bisa jawab 500 dalam <100ms
 * (bukan gantung 8 dtk lalu timeout misterius).
 * Return null kalau env OK.
 */
export function dbEnvError(): string | null {
  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.DIRECT_URL) missing.push("DIRECT_URL");
  if (missing.length > 0) {
    return (
      `Koneksi database belum dikonfigurasi (${missing.join(", ")} kosong). ` +
      `Isi di Vercel Dashboard → Project → Settings → Environment Variables ` +
      `(atau Storage → Connect → Supabase agar auto-keisi), lalu Redeploy. ` +
      `Lihat .env.example untuk formatnya.`
    );
  }
  return null;
}

export default prisma;
