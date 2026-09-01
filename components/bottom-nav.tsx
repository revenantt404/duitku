"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Wallet, PieChart, Target } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function BottomNav() {
  const pathname = usePathname();
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
