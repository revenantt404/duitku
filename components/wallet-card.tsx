"use client";
import { Card, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
import { Wallet, Landmark, Smartphone, TrendingUp, Package } from "lucide-react";

const iconMap: Record<string, any> = {
  wallet: Wallet,
  landmark: Landmark,
  smartphone: Smartphone,
  "trending-up": TrendingUp,
  package: Package,
};

export function WalletCard({ wallet, balance, negative }: { wallet: { id: string; name: string; type: string; color: string; icon: string }; balance: number; negative?: boolean }) {
  const Icon = iconMap[wallet.icon] || Wallet;
  // interaktif: hijau aman / kuning waspada / merah rugi — langsung kebaca
  const state: "good" | "warn" | "bad" = negative || balance < 0 ? "bad" : balance < 500000 ? "warn" : "good";
  const iconBg =
    state === "bad"
      ? "bg-[#b42318] dark:bg-[#fca5a5] text-white dark:text-[#141414]"
      : state === "warn"
        ? "bg-[#a16207] dark:bg-[#fcd34d] text-white dark:text-[#141414]"
        : "bg-[#1a7a4a] dark:bg-[#4ade80] text-white dark:text-[#141414]";
  return (
    <Card className="card-hover">
      <CardContent className="p-4">
        <div className="flex items-center gap-2.5">
          <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 border hairline ${iconBg}`}>
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold leading-tight tracking-tight truncate text-ink dark:text-[#e9e6e2]">{wallet.name}</div>
            <div className="text-[11px] tracking-wide text-mute dark:text-[#8f8b85]">{wallet.type}</div>
          </div>
        </div>
        <div className={`mt-3 text-[18px] font-semibold tracking-tight leading-none num ${state === "bad" ? "text-[#b42318] dark:text-[#fca5a5]" : state === "warn" ? "text-[#a16207] dark:text-[#fcd34d]" : "text-[#1a7a4a] dark:text-[#4ade80]"}`}>{formatRupiah(balance)}</div>
        {state === "bad" && <div className="mt-1 inline-flex items-center rounded-full border hairline bg-white dark:bg-[#1d1d1d] px-2 py-0.5 text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">Saldo minus · rugi</div>}
        {state === "warn" && <div className="mt-1 inline-flex items-center rounded-full border hairline bg-white dark:bg-[#1d1d1d] px-2 py-0.5 text-[11px] font-medium text-[#a16207] dark:text-[#fcd34d]">Tipis</div>}
      </CardContent>
    </Card>
  );
}
