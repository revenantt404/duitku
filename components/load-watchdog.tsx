"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { SESSION_FLAG } from "@/lib/session-flag";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, LogOut } from "lucide-react";

type SourceState = { key: string; label: string; done: boolean; failed: boolean };

const STUCK_AFTER_MS = 12_000;

function clearDemoFlag() {
  try {
    localStorage.removeItem("duitku_demo_user");
  } catch {}
}

/**
 * Watchdog anti skeleton-infinite.
 * Render nothing selama loading wajar (< STUCK_AFTER_MS).
 * Kalau lewat batas dan query belum settle → tampilkan panel recovery
 * (status per-sumber, retry, reload, logout) alih-alih skeleton selamanya.
 */
export function LoadWatchdog({
  sources,
  onRetry,
}: {
  sources: SourceState[];
  onRetry?: () => void;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const [stuck, setStuck] = useState(false);
  const [busy, setBusy] = useState(false);

  const sig = sources.map((s) => `${s.key}:${s.done}:${s.failed}`).join("|");
  const allDone = sources.every((s) => s.done);

  useEffect(() => {
    setStuck(false);
    if (allDone) return;
    const t = setTimeout(() => setStuck(true), STUCK_AFTER_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, allDone]);

  if (!stuck || allDone) return null;

  const failed = sources.filter((s) => s.failed);
  const pending = sources.filter((s) => !s.done && !s.failed);
  const authHint = failed.length > 0 || pending.length > 0;

  async function handleRetry() {
    setBusy(true);
    try {
      clearDemoFlag();
      onRetry?.();
      await qc.invalidateQueries();
      await qc.refetchQueries({ type: "active" });
    } finally {
      setBusy(false);
    }
  }

  function handleReload() {
    clearDemoFlag();
    window.location.reload();
  }

  async function handleLogout() {
    setBusy(true);
    try {
      try {
        localStorage.removeItem("duitku_demo_user");
      } catch {}
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {}
      try {
        sessionStorage.removeItem(SESSION_FLAG);
      } catch {}
      qc.clear();
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <Card className="border-[#b42318]/30 dark:border-[#fca5a5]/30">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#b42318]/10 text-[#b42318] dark:bg-[#fca5a5]/10 dark:text-[#fca5a5]">
            <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold tracking-tight text-ink dark:text-[#e9e6e2]">
              Lagi lama bukanya — coba cara di bawah
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-mute dark:text-[#a7a39d]">
              {authHint
                ? "Sebagian data belum balik dari server (biasanya sesi loginnya belum kebaca atau koneksi lagi lemot). Coba tombol di bawah."
                : "Koneksi lagi lemot. Coba tombol di bawah."}
            </p>
            <ul className="mt-3 space-y-1.5">
              {sources.map((s) => (
                <li key={s.key} className="flex items-center gap-2 text-[12px]">
                  <span
                    className={
                      s.done
                        ? "h-2 w-2 rounded-full bg-[#1a7a4a] dark:bg-[#4ade80]"
                        : s.failed
                          ? "h-2 w-2 rounded-full bg-[#b42318] dark:bg-[#fca5a5]"
                          : "h-2 w-2 animate-pulse rounded-full bg-[#a16207] dark:bg-[#fcd34d]"
                    }
                    aria-hidden
                  />
                  <span className="font-medium text-ink dark:text-[#e9e6e2]">{s.label}</span>
                  <span className="text-mute dark:text-[#8f8b85]">
                    {s.done ? "ok" : s.failed ? "gagal" : "menunggu…"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={handleRetry} disabled={busy}>
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
                {busy ? "Mencoba…" : "Coba lagi"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleReload}>
                Muat ulang halaman
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-[#b42318] dark:text-[#fca5a5]"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                Logout & login ulang
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
