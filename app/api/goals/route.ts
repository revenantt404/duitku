import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { goalSchema } from "@/lib/validations";

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

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(data.map((g) => ({ ...g, targetAmount: g.targetAmount.toString(), currentAmount: g.currentAmount.toString() })));
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const g = await prisma.goal.create({
    data: {
      userId,
      name: parsed.data.name,
      targetAmount: BigInt(parsed.data.targetAmount),
      currentAmount: BigInt(parsed.data.currentAmount || 0),
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline as any) : null,
      icon: parsed.data.icon,
      color: parsed.data.color,
    },
  });
  return NextResponse.json({ ...g, targetAmount: g.targetAmount.toString(), currentAmount: g.currentAmount.toString() }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const parsed = goalSchema.partial().safeParse(rest);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data: any = { ...parsed.data };
  if (data.targetAmount !== undefined) data.targetAmount = BigInt(data.targetAmount);
  if (data.currentAmount !== undefined) data.currentAmount = BigInt(data.currentAmount);
  if (data.deadline !== undefined) data.deadline = data.deadline ? new Date(data.deadline) : null;
  const existing = await prisma.goal.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const g = await prisma.goal.update({ where: { id }, data });
  return NextResponse.json({ ...g, targetAmount: g.targetAmount.toString(), currentAmount: g.currentAmount.toString() });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const g = await prisma.goal.findFirst({ where: { id, userId } });
  if (!g) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
