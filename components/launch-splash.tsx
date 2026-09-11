"use client";
import { useEffect, useState } from "react";

const SEEN_KEY = "duitku_launch_seen";

/** Splash awal launch: tampil sekali per sesi, fade-out, skip bila reduced-motion. */
export function LaunchSplash() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        sessionStorage.setItem(SEEN_KEY, "1");
        return;
      }
      sessionStorage.setItem(SEEN_KEY, "1");
      setShow(true);
      const t1 = setTimeout(() => setLeaving(true), 1400);
      const t2 = setTimeout(() => setShow(false), 1750);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } catch {
      return;
    }
  }, []);

  if (!show) return null;
  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-paper dark:bg-[#141414] transition-opacity duration-300 ${leaving ? "opacity-0" : "opacity-100"}`}
      aria-hidden
    >
      <div className="flex flex-col items-center gap-3">
        <video src="/loading.mp4" autoPlay loop muted playsInline className="h-36 w-auto rounded-[18px]" />
        <div className="text-[18px] font-[500] tracking-tight text-ink dark:text-[#e9e6e2]">duitku.</div>
      </div>
    </div>
  );
}
