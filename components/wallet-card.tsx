"use client";
import { Card, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";

export function WalletCard({ wallet, balance, negative }: { wallet: { id: string; name: string; type: string; color: string; icon: string }; balance: number; negative?: boolean }) {
  const state: "good" | "warn" | "bad" = negative || balance < 0 ? "bad" : balance < 500000 ? "warn" : "good";
  return (
    <Card className="card-hover">
      <CardContent className="p-4">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold leading-tight tracking-tight truncate text-ink dark:text-[#e9e6e2]">{wallet.name}</div>
          <div className="text-[11px] tracking-wide text-mute dark:text-[#8f8b85]">{wallet.type}</div>
        </div>
        <div className={`mt-3 text-[18px] font-semibold tracking-tight leading-none num ${state === "bad" ? "text-[#b42318] dark:text-[#fca5a5]" : state === "warn" ? "text-[#a16207] dark:text-[#fcd34d]" : "text-[#1a7a4a] dark:text-[#4ade80]"}`}>{formatRupiah(balance)}</div>
        {state === "bad" && <div className="mt-1 inline-flex items-center rounded-full border hairline bg-white dark:bg-[#1d1d1d] px-2 py-0.5 text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">Saldo minus · rugi</div>}
        {state === "warn" && <div className="mt-1 inline-flex items-center rounded-full border hairline bg-white dark:bg-[#1d1d1d] px-2 py-0.5 text-[11px] font-medium text-[#a16207] dark:text-[#fcd34d]">Tipis</div>}
      </CardContent>
    </Card>
  );
}
