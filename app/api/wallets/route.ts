import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { walletSchema } from "@/lib/validations";
import { ensureUserAndGetId } from "@/lib/ensure-user";

async function getUserIdOr401(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  if (!user.email) return null;
  try {
    return await ensureUserAndGetId(user as any);
  } catch (e) {
    console.error("[wallets] ensureUser failed:", e);
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getUserIdOr401();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const wallets = await prisma.wallet.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
    return NextResponse.json(wallets.map((w) => ({ ...w, initialBalance: w.initialBalance.toString() })));
  } catch (e: any) {
    console.error("[wallets GET] failed:", e);
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdOr401();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
    const parsed = walletSchema.safeParse(body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const firstField = (Object.values(flat.fieldErrors) as any)?.find((a: any) => a?.[0])?.[0];
      const msg = (firstField as string) || flat.formErrors[0] || "Validasi gagal";
      return NextResponse.json({ error: msg, details: flat }, { status: 400 });
    }
    let initial: bigint;
    try {
      const n = Math.trunc(Number(parsed.data.initialBalance) || 0);
      initial = BigInt(n < 0 ? 0 : n);
    } catch {
      initial = BigInt(0);
    }
    const w = await prisma.wallet.create({
      data: {
        userId,
        name: String(parsed.data.name).trim(),
        type: parsed.data.type as any,
        color: parsed.data.color,
        icon: parsed.data.icon,
        initialBalance: initial,
      },
    });
    return NextResponse.json({ ...w, initialBalance: w.initialBalance.toString() }, { status: 201 });
  } catch (e: any) {
    console.error("[wallets POST] failed:", e);
    const msg = e?.message || String(e);
    // jangan bocorkan prisma internals berlebihan, tapi cukup untuk debug lokal
    return NextResponse.json({ error: msg, code: e?.code }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserIdOr401();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const owned = await prisma.wallet.findFirst({ where: { id, userId } });
    if (!owned) return NextResponse.json({ error: "Not found / bukan dompet milikmu" }, { status: 404 });

    // 1) cegah hapus kalau masih ada transaksi AKTIF (deletedAt = null)
    const activeCount = await prisma.transaction.count({
      where: { OR: [{ walletId: id }, { toWalletId: id }], userId, deletedAt: null },
    });
    if (activeCount > 0) {
      return NextResponse.json(
        { error: `Dompet masih dipakai ${activeCount} transaksi aktif — hapus/pindahkan dulu di halaman Transaksi` },
        { status: 409 }
      );
    }

    // 2) kalau cuma sisa transaksi SAMPAH (soft-delete, deletedAt != null),
    //    itu masih nge-block FK `Wallet_restrict` (Prisma onDelete: Restrict).
    //    Dari sudut user kan udah "kosong" — jadi bersihkan sampahnya dulu biar bisa hapus.
    //    Ini yang bikin "udah gw kosongin kok masih kepake".
    const trashedCount = await prisma.transaction.count({
      where: { OR: [{ walletId: id }, { toWalletId: id }], userId, deletedAt: { not: null } },
    });
    if (trashedCount > 0) {
      await prisma.transaction.deleteMany({
        where: { OR: [{ walletId: id }, { toWalletId: id }], userId, deletedAt: { not: null } },
      });
      console.warn(`[wallets DELETE] purged ${trashedCount} soft-deleted tx for wallet ${id} before delete`);
    }

    await prisma.wallet.delete({ where: { id } });
    return NextResponse.json({ ok: true, purged: trashedCount });
  } catch (e: any) {
    console.error("[wallets DELETE] failed:", e);
    if (e?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (e?.code === "P2003") {
      // harusnya udah ke-handle trashed di atas, kalau masih P2003 berarti ada transaksi aktif yang kelewat
      // atau bug ensureUser id mismatch lama — kasih pesan yang jelas
      return NextResponse.json(
        { error: "Dompet masih dipakai transaksi (FK) — coba refresh halaman Transaksi, pastikan filter 'Semua' dan hapus lagi, lalu coba hapus dompet" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserIdOr401();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
    const { id, ...rest } = body as any;
    if (!id || typeof id !== "string") return NextResponse.json({ error: "id required" }, { status: 400 });
    const owned = await prisma.wallet.findFirst({ where: { id, userId } });
    if (!owned) return NextResponse.json({ error: "Not found / bukan dompet milikmu" }, { status: 404 });
    const parsed = walletSchema.partial().safeParse(rest);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const firstField = (Object.values(flat.fieldErrors) as any)?.find((a: any) => a?.[0])?.[0];
      const msg = (firstField as string) || flat.formErrors[0] || "Validasi gagal";
      return NextResponse.json({ error: msg, details: flat }, { status: 400 });
    }
    if (Object.keys(parsed.data).length === 0) return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
    const data: any = { ...parsed.data };
    if (data.initialBalance !== undefined) {
      try {
        const n = Math.trunc(Number(data.initialBalance) || 0);
        data.initialBalance = BigInt(n < 0 ? 0 : n);
      } catch {
        data.initialBalance = BigInt(0);
      }
    }
    if (data.name !== undefined) {
      data.name = String(data.name).trim();
      if (!data.name) return NextResponse.json({ error: "Nama dompet wajib diisi" }, { status: 400 });
    }
    try {
      const w = await prisma.wallet.update({ where: { id }, data });
      return NextResponse.json({ ...w, initialBalance: w.initialBalance.toString() });
    } catch (e: any) {
      if (e?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
      throw e;
    }
  } catch (e: any) {
    console.error("[wallets PATCH] failed:", e);
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}
