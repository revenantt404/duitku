import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { budgetSchema } from "@/lib/validations";

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  await prisma.user.upsert({
    where: { email: user.email! },
    update: {},
    create: { id: user.id, email: user.email!, name: user.user_metadata?.name ?? null },
  }).catch(() => {});
  return user.id;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const month = req.nextUrl.searchParams.get("month");
  const year = req.nextUrl.searchParams.get("year");
  const where: any = { userId };
  if (month) where.month = parseInt(month, 10);
  if (year) where.year = parseInt(year, 10);
  const data = await prisma.budget.findMany({ where, include: { category: true }, orderBy: { categoryId: "asc" } });
  return NextResponse.json(data.map((b) => ({ ...b, amount: b.amount.toString() })));
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const exists = await prisma.budget.findUnique({
    where: { userId_categoryId_month_year: { userId, categoryId: parsed.data.categoryId, month: parsed.data.month, year: parsed.data.year } },
  });
  if (exists) return NextResponse.json({ error: "Budget kategori ini di bulan tersebut sudah ada" }, { status: 409 });
  const b = await prisma.budget.create({
    data: { userId, categoryId: parsed.data.categoryId, amount: BigInt(parsed.data.amount), month: parsed.data.month, year: parsed.data.year },
  });
  return NextResponse.json({ ...b, amount: b.amount.toString() }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, amount } = body;
  if (!id || amount === undefined) return NextResponse.json({ error: "id & amount required" }, { status: 400 });
  const b = await prisma.budget.findFirst({ where: { id, userId } });
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.budget.update({ where: { id }, data: { amount: BigInt(amount) } });
  return NextResponse.json({ ...updated, amount: updated.amount.toString() });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const b = await prisma.budget.findFirst({ where: { id, userId } });
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.budget.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
