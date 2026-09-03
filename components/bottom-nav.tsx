"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, ArrowLeftRight, Wallet, PieChart, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listWallets,
  listCategories,
  listTransactions,
  listBudgets,
  listGoals,
} from "@/lib/api";

export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/dompet", label: "Dompet", icon: Wallet },
  { href: "/anggaran", label: "Anggaran", icon: PieChart },
  { href: "/tujuan", label: "Tujuan", icon: Target },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function isDemoMode(): boolean {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const placeholder = !url || !key || url.includes("placeholder") || key === "placeholder" || url.includes("localhost");
    if (placeholder) return true;
    if (localStorage.getItem("duitku_demo_user")) return true;
  } catch {}
  return false;
}

const PREFETCH: Record<string, { key: unknown[]; fn: () => Promise<unknown> }[]> = {
  "/dashboard": [
    { key: ["wallets"], fn: () => listWallets() },
    { key: ["categories"], fn: () => listCategories() },
    { key: ["transactions"], fn: () => listTransactions() },
    { key: ["budgets"], fn: () => listBudgets() },
    { key: ["goals"], fn: () => listGoals() },
  ],
  "/transaksi": [
    { key: ["wallets"], fn: () => listWallets() },
    { key: ["categories"], fn: () => listCategories() },
    { key: ["transactions"], fn: () => listTransactions() },
  ],
  "/dompet": [
    { key: ["wallets"], fn: () => listWallets() },
    { key: ["transactions"], fn: () => listTransactions() },
  ],
  "/anggaran": [
    { key: ["categories"], fn: () => listCategories() },
    { key: ["transactions"], fn: () => listTransactions() },
    { key: ["budgets"], fn: () => listBudgets() },
  ],
  "/tujuan": [
    { key: ["goals"], fn: () => listGoals() },
  ],
};

export function BottomNav() {
  const pathname = usePathname();
  const qc = useQueryClient();

  const prefetch = useCallback(
    (href: string) => {
      if (isDemoMode()) return;
      const entries = PREFETCH[href];
      if (!entries) return;
      for (const { key, fn } of entries) {
        qc.prefetchQuery({ queryKey: key, queryFn: fn as any, staleTime: 30_000 });
      }
    },
    [qc]
  );

  // idle prefetch dashboard once after mount (warm cache for fastest first nav)
  useEffect(() => {
    if (isDemoMode()) return;
    const run = () => {
      for (const { key, fn } of PREFETCH["/dashboard"] ?? []) {
        qc.prefetchQuery({ queryKey: key, queryFn: fn as any, staleTime: 30_000 });
      }
    };
    const ric: any = (window as any).requestIdleCallback;
    let id: number | undefined;
    if (typeof ric === "function") id = ric(run, { timeout: 2000 });
    else id = window.setTimeout(run, 800) as unknown as number;
    return () => {
      const cic: any = (window as any).cancelIdleCallback;
      if (typeof cic === "function" && typeof id === "number") try { cic(id); } catch {}
      else clearTimeout(id);
    };
  }, [qc]);

  return (
    <nav
      aria-label="Navigasi utama"
      className="bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 border-t hairline bg-paper dark:bg-[#141414]"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -1px 0 rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-stretch justify-around gap-1 px-2 pt-2 pb-2" style={{ height: 64 }}>
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onMouseEnter={() => prefetch(item.href)}
              onTouchStart={() => prefetch(item.href)}
              onFocus={() => prefetch(item.href)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full min-w-0 px-1 py-1.5 transition-colors touch-manipulation",
                "min-h-[44px]",
                active
                  ? "bg-ink text-paper dark:bg-[#e9e6e2] dark:text-[#141414]"
                  : "text-mute dark:text-[#8f8b85] hover:text-ink dark:hover:text-[#e9e6e2]"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2 : 1.75} />
              <span className="text-[10px] leading-none font-medium tracking-wide truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
