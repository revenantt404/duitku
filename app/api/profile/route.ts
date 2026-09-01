import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function getUserIdOr401() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  await prisma.user.upsert({
    where: { email: user.email! },
    update: {},
    create: { id: user.id, email: user.email!, name: (user.user_metadata as any)?.display_name || (user.user_metadata as any)?.name || null, avatarUrl: (user.user_metadata as any)?.avatar_url || null },
  }).catch(() => {});
  return user;
}

export async function GET() {
  const user = await getUserIdOr401();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let row: any = null;
  try {
    row = await prisma.user.findUnique({ where: { id: user.id } });
  } catch {}
  // avatar custom (base64) sekarang di localStorage per-email, jangan ambil dari DB/auth
  // biar cookie gak bengkak 431. DB hanya untuk nama.
  const meta: any = (user.user_metadata as any) || {};
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: row?.name || meta.display_name || meta.name || meta.full_name || null,
    avatarUrl: null,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getUserIdOr401();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 30) : undefined;

  if (name !== undefined && name.length === 0) {
    return NextResponse.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
  }

  // avatar base64 JANGAN disimpan ke DB/auth (bikin cookie 431 & prisma error)
  // avatar disimpan di localStorage `duitku_avatar_<email>` di client (app-shell.tsx)
  let updated: any = null;
  if (name !== undefined) {
    try {
      updated = await prisma.user.update({ where: { id: user.id }, data: { name } });
    } catch {
      updated = null;
    }
    try {
      const supabase = await createClient();
      await supabase.auth.updateUser({ data: { display_name: name, name } }).catch(() => {});
    } catch {}
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: updated?.name ?? name ?? null,
    avatarUrl: null,
  });
}
