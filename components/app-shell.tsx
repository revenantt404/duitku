"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, LogOut, Sun, Moon, Camera, Trash2 } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transaksi", label: "Transaksi" },
  { href: "/dompet", label: "Dompet" },
  { href: "/anggaran", label: "Anggaran" },
  { href: "/tujuan", label: "Tujuan" },
];

/** Pastikan cuma URL valid (http/https/data:) yang dipakai — fallback ke null */
function validAvatar(u: unknown): string | null {
  if (typeof u !== "string" || u.trim() === "") return null;
  const s = u.trim();
  if (/^https?:\/\//i.test(s) || /^data:image\//i.test(s)) return s;
  return null;
}

function getInitials(name: string, email: string) {
  const src = (name || email || "").trim();
  if (!src || src === "—") return "DU";
  if (src.includes("@")) {
    const local = src.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    if (local.length === 1) return (local[0] + "U").toUpperCase();
  }
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function AppShell({ children, email }: { children: React.ReactNode; email?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [demo, setDemo] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const { resolved, setTheme } = useTheme();
  const isDark = resolved === "dark";

  const [profileName, setProfileName] = useState<string>("");
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingAvatar, setEditingAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // hydrate — per-user isolation (fix: pfp sama antar akun)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const isPlaceholder = !url || url.includes("placeholder") || url.includes("localhost");

      // bersihin key global lama yang bikin bocor antar akun (sekali)
      try {
        if (localStorage.getItem("duitku_profile_avatar") || localStorage.getItem("duitku_profile_name")) {
          // migrasi: kalau ada demo_user, merge ke situ lalu hapus global
          const raw = localStorage.getItem("duitku_demo_user");
          if (raw) {
            try {
              const j = JSON.parse(raw);
              const av = localStorage.getItem("duitku_profile_avatar");
              const nm = localStorage.getItem("duitku_profile_name");
              if (av && !j.avatar) j.avatar = av;
              if (nm && !j.name) j.name = nm;
              localStorage.setItem("duitku_demo_user", JSON.stringify(j));
            } catch {}
          }
          localStorage.removeItem("duitku_profile_avatar");
          localStorage.removeItem("duitku_profile_name");
        }
      } catch {}

      // demo: baca dari duitku_demo_user per-browser (scoped ke 1 akun demo)
      try {
        const raw = localStorage.getItem("duitku_demo_user");
        if (raw) {
          setDemo(true);
          const j = JSON.parse(raw);
          if (!cancelled) {
            if (j?.name) setProfileName(j.name);
            const av = validAvatar(j?.avatar);
            if (av) setProfileAvatar(av);
          }
        }
      } catch {}

      // supabase: fetch fresh per login (jangan pakai cache global)
      if (!isPlaceholder) {
        try {
          const supabase = createClient();
          const { data } = await supabase.auth.getUser();
          const u = data.user;
          if (u && !cancelled) {
            const meta: any = u.user_metadata || {};
            const identities: any[] = (u as any).identities || [];
            const idData: any = identities[0]?.identity_data || {};

            const nm = meta.display_name || meta.name || meta.full_name || idData.full_name || idData.name || "";
            if (nm) setProfileName(nm);
            else if (u.email) setProfileName(u.email.split("@")[0]);

            // auto-clear base64 lama di metadata (bikin cookie 431) — jangan ditunggu
            const curAvRaw = meta.avatar_url || meta.avatar || null;
            if (typeof curAvRaw === "string" && curAvRaw.startsWith("data:")) {
              supabase.auth.updateUser({ data: { avatar_url: null } }).catch(() => {});
            }

            // avatar prioritas: localStorage per-email (custom upload) > google picture
            let resolvedAv: string | null = null;
            const vLocal = validAvatar(localStorage.getItem(`duitku_avatar_${u.email || "anon"}`));
            if (vLocal) {
              resolvedAv = vLocal;
            } else {
              // coba semua sumber foto Google yang mungkin
              const candidates = [
                meta.avatar_url,
                meta.avatar,
                meta.picture,
                idData.avatar_url,
                idData.picture,
                idData.avatar,
              ];
              for (const c of candidates) {
                const v = validAvatar(c);
                if (v && !v.startsWith("data:")) { resolvedAv = v; break; }
              }
            }
            // nama tetap bisa dari /api/profile (DB) — override kalau ada
            try {
              const r = await fetch("/api/profile", { cache: "no-store" });
              if (r.ok) {
                const j = await r.json();
                if (j?.name) setProfileName(j.name);
              }
            } catch {}
            // selalu set (null = fallback User icon) biar gak nyangkut avatar akun sebelumnya
            setProfileAvatar(resolvedAv);
          } else if (!cancelled) {
            // tidak ada session supabase (misal logout) — kosongin biar gak nyangkut
            setProfileAvatar(null);
          }
        } catch {}
      }
    }
    load();
    return () => { cancelled = true; };
    // re-run saat email ganti (ganti akun)
  }, [email]);

  useEffect(() => {
    if (profileDialogOpen) {
      setEditingName(profileName || "");
      setEditingAvatar(profileAvatar);
    }
  }, [profileDialogOpen, profileName, profileAvatar]);

  useEffect(() => {
    if (!profileMenuOpen) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (menuRef.current && menuRef.current.contains(t)) return;
      if (btnRef.current && btnRef.current.contains(t)) return;
      setProfileMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [profileMenuOpen]);

  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  useEffect(() => { setProfileMenuOpen(false); setDrawerOpen(false); }, [pathname]);

  async function handleLogout() {
    setProfileMenuOpen(false);
    try {
      localStorage.removeItem("duitku_demo_user");
      localStorage.removeItem("duitku_profile_avatar");
      localStorage.removeItem("duitku_profile_name");
    } catch {}
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isPlaceholder = !url || url.includes("placeholder") || url.includes("localhost");
    if (!isPlaceholder) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    // reset state biar pfp gak kebawa ke akun berikutnya
    setProfileName("");
    setProfileAvatar(null);
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function handleSaveProfile() {
    const name = editingName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const isPlaceholder = !url || url.includes("placeholder") || url.includes("localhost");
      const nextAvatar = editingAvatar || null;

      if (isPlaceholder || demo) {
        try {
          const raw = localStorage.getItem("duitku_demo_user");
          let cur: any = {};
          try { cur = raw ? JSON.parse(raw) : {}; } catch {}
          const next = { ...cur, name, avatar: nextAvatar, email: cur.email || email || "demo@duitku.local" };
          localStorage.setItem("duitku_demo_user", JSON.stringify(next));
        } catch {}
        setProfileName(name);
        setProfileAvatar(nextAvatar);
      } else {
        // avatar hanya disimpan di localStorage (per-email) — jangan kirim ke Supabase
        // metadata, karena bisa bikin session cookie kebesaran (HTTP 431).
        // Nama saja yang di-sync ke Supabase auth metadata.
        try {
          localStorage.setItem(`duitku_avatar_${email || "anon"}`, nextAvatar || "");
        } catch {}

        const supabase = createClient();
        // bersihin avatar_url base64 lama di metadata (bikin cookie 431) — set null
        const { data: { user: curU } } = await supabase.auth.getUser();
        const curAv = (curU?.user_metadata as any)?.avatar_url;
        const needClear = typeof curAv === "string" && curAv.startsWith("data:");
        const { error } = await supabase.auth.updateUser({
          data: needClear ? { display_name: name, name, avatar_url: null } : { display_name: name, name },
        });
        if (error) throw error;
        try {
          await fetch("/api/profile", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name }),
          });
        } catch {}
        setProfileName(name);
        setProfileAvatar(nextAvatar);
      }
      setProfileDialogOpen(false);
    } catch (e: any) {
      alert(e?.message || "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1_800_000) { alert("Foto maksimal 1.8MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setEditingAvatar(dataUrl || null);
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  const displayEmail = email || (demo ? "demo@duitku.local" : "—");
  const displayName = profileName || (displayEmail.includes("@") ? displayEmail.split("@")[0] : "User");
  const initials = getInitials(displayName, displayEmail);

  return (
    <div className="min-h-screen bg-paper dark:bg-[#141414]">
      <div
        ref={menuRef}
        id="profileMenu"
        hidden={!profileMenuOpen}
        role="menu"
        aria-label="Profil"
        style={{
          display: profileMenuOpen ? "block" : "none",
          position: "fixed",
          zIndex: 9999,
          minWidth: 264,
          maxWidth: "min(320px, calc(100vw - 24px))",
          borderRadius: 18,
          overflow: "hidden",
          background: isDark ? "#1d1d1d" : "#ffffff",
          color: isDark ? "#e9e6e2" : "#1a1a1a",
          border: `1px solid ${isDark ? "#2a2a2a" : "#e6e3df"}`,
          boxShadow: "none",
          top: 56,
          right: 16,
        }}
      >
        <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b hairline bg-[#f3f1ec] dark:bg-[#222]">
          <div className="h-10 w-10 rounded-full overflow-hidden border hairline shrink-0 bg-white dark:bg-[#1d1d1d] grid place-items-center">
            {profileAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileAvatar} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="h-full w-full grid place-items-center bg-[#f3f1ec] dark:bg-[#222] text-mute dark:text-[#8f8b85]">
                <User className="h-5 w-5" strokeWidth={1.75} />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold leading-tight truncate tracking-tight">{displayName}</div>
            <div className="text-[11px] leading-tight truncate text-mute dark:text-[#a7a39d]">{displayEmail} {demo && "· Demo"}</div>
          </div>
        </div>

        <div className="py-2">
          <button
            type="button"
            role="menuitem"
            onClick={() => { setProfileMenuOpen(false); setProfileDialogOpen(true); }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[13px]"
            style={{ background: "transparent", border: 0, cursor: "pointer", font: "inherit", color: "inherit" }}
          >
            <span className="h-8 w-8 rounded-full border hairline bg-[#f3f1ec] dark:bg-[#141414] grid place-items-center shrink-0">
              <User className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
            <span className="flex-1">
              <span className="font-medium">Profile Settings</span>
              <span className="block text-[11px] text-mute dark:text-[#8f8b85] leading-none mt-0.5">Ganti foto & nama</span>
            </span>
          </button>

          <div className="mx-4 my-2 border-t hairline" />

          <div className="px-4 pb-1">
            <div className="text-[11px] font-medium tracking-widest uppercase text-mute dark:text-[#8f8b85] mb-2">Tema</div>
            <div className="inline-flex gap-1 rounded-full bg-[#f3f1ec] dark:bg-[#1d1d1d] p-1 border hairline w-full">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={resolved === "light"}
                onClick={() => setTheme("light")}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors",
                  resolved === "light" ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414]" : "text-mute dark:text-[#8f8b85] hover:text-ink dark:hover:text-[#e9e6e2]"
                )}
              >
                <Sun className="h-3.5 w-3.5" strokeWidth={1.75} /> Light
              </button>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={resolved === "dark"}
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors",
                  resolved === "dark" ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414]" : "text-mute dark:text-[#8f8b85] hover:text-ink dark:hover:text-[#e9e6e2]"
                )}
              >
                <Moon className="h-3.5 w-3.5" strokeWidth={1.75} /> Dark
              </button>
            </div>
            <div className="mt-1.5 flex gap-1">
              <button
                type="button"
                onClick={() => setTheme("system")}
                className="text-[11px] text-mute dark:text-[#8f8b85] hover:text-ink dark:hover:text-[#e9e6e2] underline underline-offset-4 decoration-[#c9c5c0] dark:decoration-[#3a3a3a]"
              >
                Ikuti sistem
              </button>
              <span className="text-[11px] text-mute dark:text-[#8f8b85]">·</span>
              <span className="text-[11px] text-mute dark:text-[#8f8b85]">{isDark ? "Dark" : "Light"} aktif</span>
            </div>
          </div>

          <div className="mx-4 my-2 border-t hairline" />

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#fef2f2] dark:hover:bg-[#2a1d1d] text-[13px] text-[#b42318] dark:text-[#fca5a5]"
            style={{ background: "transparent", border: 0, cursor: "pointer", font: "inherit" }}
          >
            <span className="h-8 w-8 rounded-full border hairline bg-[#fef2f2] dark:bg-[#1d1d1d] grid place-items-center shrink-0">
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
      {profileMenuOpen && (
        <div className="fixed inset-0 z-[9998]" aria-hidden onClick={() => setProfileMenuOpen(false)} />
      )}

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent onClose={() => setProfileDialogOpen(false)} className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
            <p className="text-[12px] text-mute dark:text-[#8f8b85]">Ganti foto profil & nama tampilan. Email tidak bisa diganti.</p>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-full overflow-hidden border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d] grid place-items-center shrink-0">
                {editingAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editingAvatar} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="h-full w-full grid place-items-center bg-[#f3f1ec] dark:bg-[#222] text-mute dark:text-[#8f8b85]">
                    <User className="h-8 w-8" strokeWidth={1.75} />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="text-[12px] font-medium text-ink dark:text-[#e9e6e2]">Foto profil</div>
                <div className="text-[11px] leading-relaxed text-mute dark:text-[#8f8b85]">JPG/PNG max 1.8MB. Per akun, gak bocor ke akun lain.</div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => fileRef.current?.click()}>
                    <Camera className="h-3.5 w-3.5" strokeWidth={1.75} /> Ganti foto
                  </Button>
                  {editingAvatar && (
                    <Button type="button" variant="ghost" size="sm" className="h-8 text-[#b42318] dark:text-[#fca5a5]" onClick={() => setEditingAvatar(null)}>
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Hapus
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Nama tampilan</Label>
              <Input id="profile-name" placeholder="Nama kamu" value={editingName} onChange={(e) => setEditingName(e.target.value)} maxLength={30} />
              <p className="text-[11px] text-mute dark:text-[#8f8b85]">{editingName.length}/30</p>
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={displayEmail} disabled className="bg-[#f3f1ec] dark:bg-[#1d1d1d] text-mute dark:text-[#a7a39d]" />
              <p className="text-[11px] text-mute dark:text-[#8f8b85]">Email dari login — tidak bisa diganti di sini.</p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setProfileDialogOpen(false)} disabled={saving}>Batal</Button>
              <Button type="button" className="flex-1" onClick={handleSaveProfile} disabled={saving || !editingName.trim()}>
                {saving ? "Menyimpan…" : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div
        id="mobileOverlay"
        hidden={!drawerOpen}
        onClick={() => setDrawerOpen(false)}
        style={{ display: drawerOpen ? "block" : "none", position: "fixed", inset: 0, background: "rgba(0,0,0,.32)", zIndex: 9998 }}
      />
      <nav
        id="mobileDrawer"
        hidden={!drawerOpen}
        aria-label="Menu"
        className={drawerOpen ? "open" : ""}
        style={{
          display: drawerOpen ? "flex" : "none",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          right: 0,
          width: 280,
          maxWidth: "82vw",
          height: "100dvh",
          background: isDark ? "#1d1d1d" : "#faf9f7",
          zIndex: 9999,
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 220ms ease",
          overflowY: "auto",
          padding: 20,
          boxShadow: "none",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <Link href="/dashboard" onClick={() => setDrawerOpen(false)} className="text-[16px] font-[500] tracking-tight">duitku.</Link>
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setDrawerOpen(false)}
            className="h-[38px] w-[38px] rounded-full border hairline grid place-items-center bg-transparent"
          >
            ✕
          </button>
        </div>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setDrawerOpen(false)}
            className={cn("flex items-center min-h-[44px] text-[15px]", isActive(n.href) ? "text-ink dark:text-[#e9e6e2] font-[500]" : "text-mute dark:text-[#a7a39d]")}
          >
            {n.label}
          </Link>
        ))}
        <div className="mt-4 border-t hairline pt-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full overflow-hidden border hairline bg-white dark:bg-[#1d1d1d] grid place-items-center shrink-0">
              {profileAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileAvatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="h-full w-full grid place-items-center bg-[#f3f1ec] dark:bg-[#222] text-mute dark:text-[#8f8b85]">
                  <User className="h-4 w-4" strokeWidth={1.75} />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium truncate">{displayName}</div>
              <div className="text-[11px] text-mute dark:text-[#a7a39d] truncate">{displayEmail}</div>
            </div>
          </div>
          <button onClick={() => { setDrawerOpen(false); setProfileDialogOpen(true); }} className="flex items-center gap-2 text-[13px] font-medium">
            <User className="h-4 w-4" strokeWidth={1.75} /> Profile Settings
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-[13px] font-medium text-[#b42318] dark:text-[#fca5a5]">
            <LogOut className="h-4 w-4" strokeWidth={1.75} /> Logout
          </button>
        </div>
      </nav>

      <header className="max-w-[720px] mx-auto px-6 md:px-0 pt-10 md:pt-16 pb-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="text-[18px] tracking-tight font-[500]">duitku.</Link>
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <nav className="hidden md:flex items-center gap-5 md:gap-6 text-[14px] md:text-[14.5px] text-mute dark:text-[#a7a39d]">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className={cn("transition-colors", isActive(n.href) ? "text-ink dark:text-[#e9e6e2]" : "hover:text-ink dark:hover:text-[#e9e6e2]")}>
                  {n.label}
                </Link>
              ))}
            </nav>
            <button
              id="mobileDrawerToggle"
              type="button"
              aria-label="Buka menu"
              aria-expanded={drawerOpen}
              aria-controls="mobileDrawer"
              onClick={() => setDrawerOpen((v) => !v)}
              className="inline-flex md:hidden h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border hairline bg-transparent"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true" className="h-[18px] w-[18px]"><path d="M5 8h14M5 12h14M5 16h14" /></svg>
            </button>
            <button
              ref={btnRef}
              id="profileToggle"
              type="button"
              aria-label="Profil"
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              aria-controls="profileMenu"
              onClick={() => setProfileMenuOpen((v) => !v)}
              className="ml-1 h-8 w-8 shrink-0 rounded-full border hairline overflow-hidden flex items-center justify-center hover:opacity-90 transition p-0 bg-white dark:bg-[#1d1d1d] aspect-square"
            >
              {profileAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileAvatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="h-full w-full grid place-items-center bg-white dark:bg-[#1d1d1d] text-mute dark:text-[#8f8b85]">
                  <User className="h-4 w-4" strokeWidth={1.75} />
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {demo && (
        <div className="max-w-[720px] mx-auto px-6 md:px-0 -mt-2 mb-6">
          <div className="rounded-[14px] border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d] px-4 py-3 flex items-center justify-between gap-3 text-[12.5px] leading-relaxed">
            <span className="text-mute dark:text-[#a7a39d]">
              Mode Demo — data di <code className="bg-white dark:bg-[#141414] border hairline rounded px-1 py-0.5">localStorage</code> (per browser). Login Supabase untuk data per akun.
            </span>
            <Link href="/login" className="hidden sm:inline underline underline-offset-4 decoration-[#c9c5c0] dark:decoration-[#3a3a3a] shrink-0">Login</Link>
          </div>
        </div>
      )}

      <main className="max-w-[720px] mx-auto px-6 md:px-0 pb-24">
        <div className="page-in">{children}</div>
        <footer className="border-t hairline mt-16 pt-8 flex flex-col sm:flex-row sm:justify-between gap-2">
          <p className="kicker">© {new Date().getFullYear()} DuitKu · paper/ink/hairline</p>
          <p className="text-[12.5px] text-mute dark:text-[#7f7b75] truncate">{displayEmail}</p>
        </footer>
      </main>
    </div>
  );
}
