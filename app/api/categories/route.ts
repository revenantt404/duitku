import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validations";

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
  const cats = await prisma.category.findMany({
    where: { OR: [{ userId }, { isSystem: true }] },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });
  return NextResponse.json(cats);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const exists = await prisma.category.findFirst({ where: { userId, name: parsed.data.name, type: parsed.data.type as any } });
  if (exists) return NextResponse.json({ error: "Kategori sudah ada" }, { status: 409 });
  const cat = await prisma.category.create({
    data: { userId, name: parsed.data.name, icon: parsed.data.icon, color: parsed.data.color, type: parsed.data.type as any, isSystem: false },
  });
  return NextResponse.json(cat, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const cat = await prisma.category.findFirst({ where: { id, userId } });
  if (!cat) return NextResponse.json({ error: "Not found / bukan kategori milikmu" }, { status: 404 });
  const used = await prisma.transaction.findFirst({ where: { categoryId: id, deletedAt: null } });
  if (used) return NextResponse.json({ error: "Kategori masih dipakai transaksi" }, { status: 409 });
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
