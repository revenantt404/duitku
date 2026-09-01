import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validations";
import { ensureUserAndGetId } from "@/lib/ensure-user";

async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || !user.email) return null;
  try {
    return await ensureUserAndGetId(user as any);
  } catch (e) {
    console.error("[categories] ensureUser failed:", e);
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const cats = await prisma.category.findMany({
      where: { OR: [{ userId }, { isSystem: true }] },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });
    return NextResponse.json(cats);
  } catch (e: any) {
    console.error("[categories GET] failed:", e);
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });

    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const first = (Object.values(flat.fieldErrors) as any)?.find((a: any) => a?.[0])?.[0] as string | undefined;
      return NextResponse.json({ error: first || flat.formErrors[0] || "Validasi gagal", details: flat }, { status: 400 });
    }

    const name = String(parsed.data.name).trim();
    if (!name) return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });

    const exists = await prisma.category.findFirst({
      where: { userId, name, type: parsed.data.type as any },
    });
    if (exists) return NextResponse.json({ error: "Kategori sudah ada" }, { status: 409 });

    try {
      const cat = await prisma.category.create({
        data: { userId, name, icon: parsed.data.icon, color: parsed.data.color, type: parsed.data.type as any, isSystem: false },
      });
      return NextResponse.json(cat, { status: 201 });
    } catch (e: any) {
      if (e?.code === "P2002") return NextResponse.json({ error: "Kategori sudah ada" }, { status: 409 });
      throw e;
    }
  } catch (e: any) {
    console.error("[categories POST] failed:", e);
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });

    const id = (body as any)?.id;
    if (!id || typeof id !== "string") return NextResponse.json({ error: "id required" }, { status: 400 });

    const cat = await prisma.category.findFirst({ where: { id, userId } });
    if (!cat) return NextResponse.json({ error: "Not found / bukan kategori milikmu" }, { status: 404 });

    const patch: any = {};
    if (typeof (body as any).name === "string" && (body as any).name.trim()) patch.name = (body as any).name.trim();
    if (typeof (body as any).color === "string" && /^#[0-9A-Fa-f]{6}$/.test((body as any).color)) patch.color = (body as any).color;
    if (typeof (body as any).icon === "string" && (body as any).icon.trim()) patch.icon = (body as any).icon.trim();
    if ((body as any).type === "INCOME" || (body as any).type === "EXPENSE") patch.type = (body as any).type;

    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });

    if (patch.name || patch.type) {
      const dup = await prisma.category.findFirst({
        where: { userId, name: patch.name ?? cat.name, type: (patch.type ?? cat.type) as any, NOT: { id } },
      });
      if (dup) return NextResponse.json({ error: "Kategori sudah ada" }, { status: 409 });
    }

    try {
      const updated = await prisma.category.update({ where: { id }, data: patch });
      return NextResponse.json(updated);
    } catch (e: any) {
      if (e?.code === "P2002") return NextResponse.json({ error: "Kategori sudah ada" }, { status: 409 });
      if (e?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
      throw e;
    }
  } catch (e: any) {
    console.error("[categories PATCH] failed:", e);
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const cat = await prisma.category.findFirst({ where: { id, userId } });
    if (!cat) return NextResponse.json({ error: "Not found / bukan kategori milikmu" }, { status: 404 });

    const used = await prisma.transaction.findFirst({ where: { categoryId: id, deletedAt: null } });
    if (used) return NextResponse.json({ error: "Kategori masih dipakai transaksi" }, { status: 409 });

    const budgetUsed = await prisma.budget.findFirst({ where: { categoryId: id, userId } });
    if (budgetUsed) return NextResponse.json({ error: "Kategori masih dipakai anggaran — hapus anggarannya dulu" }, { status: 409 });

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[categories DELETE] failed:", e);
    if (e?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    // P2003 = FK restrict (mis. Budget masih refer)
    if (e?.code === "P2003") return NextResponse.json({ error: "Kategori masih dipakai (FK) — hapus anggaran/transaksi dulu" }, { status: 409 });
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}
