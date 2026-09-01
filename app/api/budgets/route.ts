import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { budgetSchema } from "@/lib/validations";
import { ensureUserAndGetId } from "@/lib/ensure-user";

async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || !user.email) return null;
  try {
    return await ensureUserAndGetId(user as any);
  } catch (e) {
    console.error("[budgets] ensureUser failed:", e);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const monthStr = req.nextUrl.searchParams.get("month");
    const yearStr = req.nextUrl.searchParams.get("year");
    const where: any = { userId };
    if (monthStr !== null && monthStr !== "") {
      const m = parseInt(monthStr, 10);
      if (!Number.isFinite(m) || m < 1 || m > 12) return NextResponse.json({ error: "month harus 1-12" }, { status: 400 });
      where.month = m;
    }
    if (yearStr !== null && yearStr !== "") {
      const y = parseInt(yearStr, 10);
      if (!Number.isFinite(y) || y < 2000 || y > 2100) return NextResponse.json({ error: "year tidak valid" }, { status: 400 });
      where.year = y;
    }
    const data = await prisma.budget.findMany({ where, include: { category: true }, orderBy: { categoryId: "asc" } });
    return NextResponse.json(data.map((b) => ({ ...b, amount: b.amount.toString() })));
  } catch (e: any) {
    console.error("[budgets GET] failed:", e);
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });

    const parsed = budgetSchema.safeParse(body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const first = (Object.values(flat.fieldErrors) as any)?.find((a: any) => a?.[0])?.[0] as string | undefined;
      return NextResponse.json({ error: first || flat.formErrors[0] || "Validasi gagal", details: flat }, { status: 400 });
    }

    let amountBig: bigint;
    try {
      const n = Math.trunc(Number(parsed.data.amount));
      if (!Number.isFinite(n) || n <= 0) throw new Error();
      amountBig = BigInt(n);
    } catch {
      return NextResponse.json({ error: "Nominal tidak valid" }, { status: 400 });
    }

    const cat = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId, OR: [{ userId }, { isSystem: true }] },
    });
    if (!cat) return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });

    const exists = await prisma.budget.findUnique({
      where: { userId_categoryId_month_year: { userId, categoryId: parsed.data.categoryId, month: parsed.data.month, year: parsed.data.year } },
    });
    if (exists) return NextResponse.json({ error: "Budget kategori ini di bulan tersebut sudah ada" }, { status: 409 });

    try {
      const b = await prisma.budget.create({
        data: { userId, categoryId: parsed.data.categoryId, amount: amountBig, month: parsed.data.month, year: parsed.data.year },
      });
      return NextResponse.json({ ...b, amount: b.amount.toString() }, { status: 201 });
    } catch (e: any) {
      if (e?.code === "P2002") return NextResponse.json({ error: "Budget kategori ini di bulan tersebut sudah ada" }, { status: 409 });
      if (e?.code === "P2003") return NextResponse.json({ error: "Kategori tidak valid (FK)" }, { status: 400 });
      throw e;
    }
  } catch (e: any) {
    console.error("[budgets POST] failed:", e);
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
    const { id, amount } = body as any;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (amount === undefined || amount === null || String(amount).trim() === "") {
      return NextResponse.json({ error: "amount required" }, { status: 400 });
    }
    let amountBig: bigint;
    try {
      const n = Math.trunc(Number(amount));
      if (!Number.isFinite(n) || n <= 0) throw new Error();
      amountBig = BigInt(n);
    } catch {
      return NextResponse.json({ error: "Nominal tidak valid" }, { status: 400 });
    }
    const b = await prisma.budget.findFirst({ where: { id: String(id), userId } });
    if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.budget.update({ where: { id: String(id) }, data: { amount: amountBig } });
    return NextResponse.json({ ...updated, amount: updated.amount.toString() });
  } catch (e: any) {
    console.error("[budgets PATCH] failed:", e);
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const b = await prisma.budget.findFirst({ where: { id, userId } });
    if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.budget.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[budgets DELETE] failed:", e);
    if (e?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}
