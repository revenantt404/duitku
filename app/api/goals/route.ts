import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { goalSchema } from "@/lib/validations";
import { requireUserId, apiError } from "@/lib/server-auth";
import { DB_TIMEOUT_MS, withTimeout } from "@/lib/server-timeout";

async function getUserId(): Promise<string | null> {
  // requireUserId: env DB dicek (<100ms), auth max 4 dtk, ensureUser max 3 dtk.
  // DB error → throw → 503 (bukan 401 yang menyesatkan).
  return await requireUserId();
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized — silakan login ulang" }, { status: 401 });
    const data = await withTimeout(
      prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      DB_TIMEOUT_MS,
      "Memuat tujuan"
    );
    return NextResponse.json(data.map((g) => ({ ...g, targetAmount: g.targetAmount.toString(), currentAmount: g.currentAmount.toString() })));
  } catch (e: any) {
    return apiError(e, "goals GET");
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
    return apiError(e, "goals POST");
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
    if (e?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return apiError(e, "goals PATCH");
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
    if (e?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return apiError(e, "goals DELETE");
  }
}
