import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { transactionSchema } from "@/lib/validations";

async function getUserIdOr401() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // sinkron User prisma (upsert biar FK aman)
  await prisma.user.upsert({
    where: { email: user.email! },
    update: { name: user.user_metadata?.name ?? undefined, avatarUrl: user.user_metadata?.avatar_url ?? undefined },
    create: { id: user.id, email: user.email!, name: user.user_metadata?.name ?? null, avatarUrl: user.user_metadata?.avatar_url ?? null },
  }).catch(() => {});
  return user.id;
}

// GET /api/transactions?month=2026-08&type=EXPENSE&q=ayam
export async function GET(req: NextRequest) {
  const userId = await getUserIdOr401();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM
  const type = searchParams.get("type");
  const q = searchParams.get("q");

  const where: any = { userId, deletedAt: null };
  if (type && type !== "ALL") where.type = type;
  if (q) where.description = { contains: q, mode: "insensitive" };
  if (month) {
    const [y, m] = month.split("-").map(Number);
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
  return NextResponse.json(data.map((t) => ({ ...t, amount: t.amount.toString() })));
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdOr401();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  // validasi wallet milik user
  const wallet = await prisma.wallet.findFirst({ where: { id: data.walletId, userId } });
  if (!wallet) return NextResponse.json({ error: "Wallet tidak ditemukan" }, { status: 404 });
  if (data.type === "TRANSFER") {
    const toW = await prisma.wallet.findFirst({ where: { id: data.toWalletId!, userId } });
    if (!toW) return NextResponse.json({ error: "Wallet tujuan tidak ditemukan" }, { status: 404 });
    const transferId = `tr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const tx = await prisma.transaction.create({
      data: {
        userId,
        walletId: data.walletId,
        toWalletId: data.toWalletId!,
        type: "TRANSFER",
        amount: BigInt(data.amount),
        description: data.description || null,
        date: data.date ? new Date(data.date) : new Date(),
        transferId,
      },
    });
    return NextResponse.json({ ...tx, amount: tx.amount.toString() }, { status: 201 });
  }

  const category = await prisma.category.findFirst({ where: { id: data.categoryId!, OR: [{ userId }, { isSystem: true }] } });
  if (!category) return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });

  const tx = await prisma.transaction.create({
    data: {
      userId,
      walletId: data.walletId,
      categoryId: data.categoryId!,
      type: data.type as any,
      amount: BigInt(data.amount),
      description: data.description || null,
      date: data.date ? new Date(data.date) : new Date(),
    },
  });
  return NextResponse.json({ ...tx, amount: tx.amount.toString() }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserIdOr401();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const tx = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // soft-delete
  if (tx.transferId) {
    await prisma.transaction.updateMany({ where: { transferId: tx.transferId, userId }, data: { deletedAt: new Date() } });
  } else {
    await prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  return NextResponse.json({ ok: true });
}
