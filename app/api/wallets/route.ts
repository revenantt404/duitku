import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { walletSchema } from "@/lib/validations";

async function getUserIdOr401() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  await prisma.user.upsert({
    where: { email: user.email! },
    update: { name: user.user_metadata?.name ?? undefined },
    create: { id: user.id, email: user.email!, name: user.user_metadata?.name ?? null },
  }).catch(() => {});
  return user.id;
}

export async function GET() {
  const userId = await getUserIdOr401();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const wallets = await prisma.wallet.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(wallets.map((w) => ({ ...w, initialBalance: w.initialBalance.toString() })));
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdOr401();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = walletSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const w = await prisma.wallet.create({
    data: { userId, name: parsed.data.name, type: parsed.data.type as any, color: parsed.data.color, icon: parsed.data.icon, initialBalance: BigInt(parsed.data.initialBalance) },
  });
  return NextResponse.json({ ...w, initialBalance: w.initialBalance.toString() }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserIdOr401();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const used = await prisma.transaction.findFirst({ where: { OR: [{ walletId: id }, { toWalletId: id }], userId, deletedAt: null } });
  if (used) return NextResponse.json({ error: "Dompet masih dipakai transaksi" }, { status: 409 });
  await prisma.wallet.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserIdOr401();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const parsed = walletSchema.partial().safeParse(rest);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data: any = { ...parsed.data };
  if (data.initialBalance !== undefined) data.initialBalance = BigInt(data.initialBalance);
  const w = await prisma.wallet.update({ where: { id }, data });
  return NextResponse.json({ ...w, initialBalance: w.initialBalance.toString() });
}
