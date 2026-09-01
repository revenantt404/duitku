import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensureUserAndGetId } from "@/lib/ensure-user";

async function getAuthOr401() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || !user.email) return null;
  try {
    const dbId = await ensureUserAndGetId(user as any);
    return { authUser: user, dbId };
  } catch (e) {
    console.error("[profile] ensureUser failed:", e);
    return null;
  }
}

export async function GET() {
  const ctx = await getAuthOr401();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { authUser, dbId } = ctx;
  let row: any = null;
  try {
    row = await prisma.user.findUnique({ where: { id: dbId } });
  } catch {}
  const meta: any = (authUser.user_metadata as any) || {};
  return NextResponse.json({
    id: authUser.id,
    email: authUser.email,
    name: row?.name || meta.display_name || meta.name || meta.full_name || null,
    avatarUrl: null,
  });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAuthOr401();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { authUser, dbId } = ctx;
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 30) : undefined;

  if (name !== undefined && name.length === 0) {
    return NextResponse.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
  }

  let updated: any = null;
  if (name !== undefined) {
    try {
      updated = await prisma.user.update({ where: { id: dbId }, data: { name } });
    } catch {
      updated = null;
    }
    try {
      const supabase = await createClient();
      await supabase.auth.updateUser({ data: { display_name: name, name } }).catch(() => {});
    } catch {}
  }

  return NextResponse.json({
    id: authUser.id,
    email: authUser.email,
    name: updated?.name ?? name ?? null,
    avatarUrl: null,
  });
}
