import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { goalSchema } from "@/lib/validations";
import { ensureUserAndGetId } from "@/lib/ensure-user";

async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || !user.email) return null;
  try {
    return await ensureUserAndGetId(user as any);
  } catch (e) {
    console.error("[goals] ensureUser failed:", e);
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const data = await prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(data.map((g) => ({ ...g, targetAmount: g.targetAmount.toString(), currentAmount: g.currentAmount.toString() })));
  } catch (e: any) {
    console.error("[goals GET] failed:", e);
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });

    const parsed = goalSchema.safeParse(body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const first = (Object.values(flat.fieldErrors) as any)?.find((a: any) => a?.[0])?.[0] as string | undefined;
      return NextResponse.json({ error: first || flat.formErrors[0] || "Validasi gagal", details: flat }, { status: 400 });
    }

    let targetBig: bigint;
    let currentBig: bigint;
    try {
      const t = Math.trunc(Number(parsed.data.targetAmount));
      if (!Number.isFinite(t) || t <= 0) throw new Error();
      targetBig = BigInt(t);
    } catch {
      return NextResponse.json({ error: "Target tidak valid" }, { status: 400 });
    }
    try {
      const c = Math.trunc(Number(parsed.data.currentAmount ?? 0) || 0);
      if (!Number.isFinite(c) || c < 0) throw new Error();
      currentBig = BigInt(c);
    } catch {
      return NextResponse.json({ error: "Saldo awal tujuan tidak valid" }, { status: 400 });
    }
    if (currentBig > targetBig) return NextResponse.json({ error: "Saldo saat ini tidak boleh melebihi target" }, { status: 400 });

    let deadline: Date | null = null;
    if (parsed.data.deadline) {
      const d = new Date(parsed.data.deadline as any);
      if (Number.isNaN(+d)) return NextResponse.json({ error: "Deadline tidak valid" }, { status: 400 });
      deadline = d;
    }

    const g = await prisma.goal.create({
      data: {
        userId,
        name: String(parsed.data.name).trim(),
        targetAmount: targetBig,
        currentAmount: currentBig,
        deadline,
        icon: parsed.data.icon,
        color: parsed.data.color,
      },
    });
    return NextResponse.json({ ...g, targetAmount: g.targetAmount.toString(), currentAmount: g.currentAmount.toString() }, { status: 201 });
  } catch (e: any) {
    console.error("[goals POST] failed:", e);
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
    const { id, ...rest } = body as any;
    if (!id || typeof id !== "string") return NextResponse.json({ error: "id required" }, { status: 400 });

    const parsed = goalSchema.partial().safeParse(rest);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const first = (Object.values(flat.fieldErrors) as any)?.find((a: any) => a?.[0])?.[0] as string | undefined;
      return NextResponse.json({ error: first || flat.formErrors[0] || "Validasi gagal", details: flat }, { status: 400 });
    }
    const data: any = { ...parsed.data };
    if (data.name !== undefined) {
      data.name = String(data.name).trim();
      if (!data.name) return NextResponse.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
    }
    if (data.targetAmount !== undefined) {
      try {
        const t = Math.trunc(Number(data.targetAmount));
        if (!Number.isFinite(t) || t <= 0) throw new Error();
        data.targetAmount = BigInt(t);
      } catch {
        return NextResponse.json({ error: "Target tidak valid" }, { status: 400 });
      }
    }
    if (data.currentAmount !== undefined) {
      try {
        const c = Math.trunc(Number(data.currentAmount) || 0);
        if (!Number.isFinite(c) || c < 0) throw new Error();
        data.currentAmount = BigInt(c);
      } catch {
        return NextResponse.json({ error: "Saldo saat ini tidak valid" }, { status: 400 });
      }
    }
    if (data.deadline !== undefined) {
      if (data.deadline === null || data.deadline === "") data.deadline = null;
      else {
        const d = new Date(data.deadline);
        if (Number.isNaN(+d)) return NextResponse.json({ error: "Deadline tidak valid" }, { status: 400 });
        data.deadline = d;
      }
    }

    const existing = await prisma.goal.findFirst({ where: { id: String(id), userId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const finalTarget = data.targetAmount !== undefined ? data.targetAmount : existing.targetAmount;
    const finalCurrent = data.currentAmount !== undefined ? data.currentAmount : existing.currentAmount;
    if (finalCurrent > finalTarget) return NextResponse.json({ error: "Saldo saat ini tidak boleh melebihi target" }, { status: 400 });

    const g = await prisma.goal.update({ where: { id: String(id) }, data });
    return NextResponse.json({ ...g, targetAmount: g.targetAmount.toString(), currentAmount: g.currentAmount.toString() });
  } catch (e: any) {
    console.error("[goals PATCH] failed:", e);
    if (e?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const g = await prisma.goal.findFirst({ where: { id, userId } });
    if (!g) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.goal.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[goals DELETE] failed:", e);
    if (e?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: e?.message || String(e), code: e?.code }, { status: 500 });
  }
}
