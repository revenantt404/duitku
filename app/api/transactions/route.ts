import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { transactionSchema } from "@/lib/validations";
import { ensureUserAndGetId } from "@/lib/ensure-user";

async function getUserIdOr401(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || !user.email) return null;
  try {
    return await ensureUserAndGetId(user as any);
  } catch (e) {
    console.error("[transactions] ensureUser failed:", e);
    return null;
  }
}

// GET /api/transactions?month=2026-08&type=EXPENSE&q=ayam
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdOr401();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const type = searchParams.get("type");
    const q = searchParams.get("q")?.trim();

    const where: any = { userId, deletedAt: null };
    if (type && type !== "ALL") {
      if (type === "INCOME" || type === "EXPENSE" || type === "TRANSFER") where.type = type;
    }
    if (q) where.description = { contains: q, mode: "insensitive" };
    if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ error: "Format month harus YYYY-MM" }, { status: 400 });
      }
      const [y, m] = month.split("-").map(Number);
      if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
        return NextResponse.json({ error: "Bulan tidak valid" }, { status: 400 });
      }
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 1));
      where.date = { gte: start, lt: end };
    }

    const data = await prisma.transaction.findMany({
      where,
      include: { category: true, wallet: true },
      orderBy: { date: "desc" },
      take: 200,
    });
    return NextResponse.json(
      data.map((t) => ({
        ...t,
        amount: t.amount.toString(),
        // wallet.initialBalance adalah BigInt — harus jadi string sebelum JSON.stringify
        wallet: t.wallet
          ? { ...t.wallet, initialBalance: (t.wallet as any).initialBalance?.toString?.() ?? "0" }
          : t.wallet,
      }))
    );
  } catch (e: any) {
    console.error("[transactions GET] failed:", e);
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdOr401();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });

    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const firstField =
        (Object.values(flat.fieldErrors) as any)?.find((a: any) => a?.[0])?.[0] as string | undefined;
      const msg = firstField || flat.formErrors[0] || "Validasi gagal";
      return NextResponse.json({ error: msg, details: flat }, { status: 400 });
    }
    const data = parsed.data;

    let amountBig: bigint;
    try {
      const n = Math.trunc(Number(data.amount));
      if (!Number.isFinite(n) || n <= 0) throw new Error("Nominal harus > 0");
      amountBig = BigInt(n);
    } catch {
      return NextResponse.json({ error: "Nominal tidak valid" }, { status: 400 });
    }

    const dateVal = data.date ? new Date(data.date as any) : new Date();
    if (Number.isNaN(+dateVal)) return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });

    const wallet = await prisma.wallet.findFirst({ where: { id: data.walletId, userId } });
    if (!wallet) return NextResponse.json({ error: "Wallet tidak ditemukan" }, { status: 404 });

    if (data.type === "TRANSFER") {
      if (!data.toWalletId) return NextResponse.json({ error: "Pilih dompet tujuan" }, { status: 400 });
      if (data.walletId === data.toWalletId)
        return NextResponse.json({ error: "Dompet asal & tujuan tidak boleh sama" }, { status: 400 });
      const toW = await prisma.wallet.findFirst({ where: { id: data.toWalletId!, userId } });
      if (!toW) return NextResponse.json({ error: "Wallet tujuan tidak ditemukan" }, { status: 404 });

      const transferId = `tr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const tx = await prisma.transaction.create({
        data: {
          userId,
          walletId: data.walletId,
          toWalletId: data.toWalletId!,
          type: "TRANSFER",
          amount: amountBig,
          description: (data.description as string) || null,
          date: dateVal,
          transferId,
        },
      });
      return NextResponse.json({ ...tx, amount: tx.amount.toString() }, { status: 201 });
    }

    if (!data.categoryId) return NextResponse.json({ error: "Pilih kategori" }, { status: 400 });
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId!, OR: [{ userId }, { isSystem: true }] },
    });
    if (!category) return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    if (category.type !== data.type) {
      return NextResponse.json(
        { error: `Kategori "${category.name}" bertipe ${category.type}, tidak cocok untuk ${data.type}` },
        { status: 400 }
      );
    }

    const tx = await prisma.transaction.create({
      data: {
        userId,
        walletId: data.walletId,
        categoryId: data.categoryId!,
        type: data.type as any,
        amount: amountBig,
        description: (data.description as string) || null,
        date: dateVal,
      },
    });
    return NextResponse.json({ ...tx, amount: tx.amount.toString() }, { status: 201 });
  } catch (e: any) {
    console.error("[transactions POST] failed:", e);
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserIdOr401();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const tx = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (tx.deletedAt) return NextResponse.json({ ok: true });

    if (tx.transferId) {
      await prisma.transaction.updateMany({
        where: { transferId: tx.transferId, userId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    } else {
      await prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[transactions DELETE] failed:", e);
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}
