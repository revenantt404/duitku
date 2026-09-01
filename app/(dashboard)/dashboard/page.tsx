"use client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ExpenseDonut } from "@/components/charts/expense-donut";
import { MonthlyBar } from "@/components/charts/monthly-bar";
import { TransactionForm } from "@/components/transaction-form";
import { WalletCard } from "@/components/wallet-card";
import { formatRupiah, formatRupiahCompact, formatDateShort } from "@/lib/utils";
import { useWallets, useCategories, useTransactions, useBudgets, useGoals } from "@/lib/use-data";
import { useToast } from "@/components/ui/toast";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, TrendingUp, TrendingDown, Receipt, Target as TargetIcon } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const walletsHook = useWallets();
  const catsHook = useCategories();
  const txHook = useTransactions();
  const budgetsHook = useBudgets();
  const goalsHook = useGoals();

  const wallets = walletsHook.data;
  const categories = catsHook.data;
  const transactions = txHook.data;
  const budgets = budgetsHook.data;
  const goals = goalsHook.data;

  const [monthFilter] = useState(() => {
    const d = new Date();
    return { month: d.getMonth(), year: d.getFullYear() };
  });

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const walletMap = useMemo(() => new Map(wallets.map((w) => [w.id, w])), [wallets]);

  const balances = useMemo(() => {
    return wallets.map((w) => {
      let bal = w.initialBalance;
      for (const t of transactions) {
        if (t.type === "INCOME" && t.walletId === w.id) bal += t.amount;
        else if (t.type === "EXPENSE" && t.walletId === w.id) bal -= t.amount;
        else if (t.type === "TRANSFER") {
          if (t.walletId === w.id) bal -= t.amount;
          if (t.toWalletId === w.id) bal += t.amount;
        }
      }
      return { wallet: w, balance: bal };
    });
  }, [wallets, transactions]);

  const totalSaldo = useMemo(() => balances.reduce((a, b) => a + b.balance, 0), [balances]);

  const monthTx = useMemo(
    () => transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === monthFilter.month && d.getFullYear() === monthFilter.year;
    }),
    [transactions, monthFilter]
  );

  const incomeMonth = useMemo(() => monthTx.filter((t) => t.type === "INCOME").reduce((a, b) => a + b.amount, 0), [monthTx]);
  const expenseMonth = useMemo(() => monthTx.filter((t) => t.type === "EXPENSE").reduce((a, b) => a + b.amount, 0), [monthTx]);
  const sisaMonth = incomeMonth - expenseMonth;

  const donutData = useMemo(() => {
    const byCat = new Map<string, number>();
    for (const t of monthTx) if (t.type === "EXPENSE" && t.categoryId) byCat.set(t.categoryId, (byCat.get(t.categoryId) || 0) + t.amount);
    return Array.from(byCat.entries()).map(([id, value]) => {
      const c = catMap.get(id);
      return { name: c?.name || id, value, color: c?.color || "#1a1a1a" };
    }).sort((a, b) => b.value - a.value);
  }, [monthTx, catMap]);

  const barData = useMemo(() => {
    const now = new Date();
    const months: { month: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const label = d.toLocaleDateString("id-ID", { month: "short" });
      const txs = transactions.filter((t) => {
        const td = new Date(t.date);
        return td.getMonth() === m && td.getFullYear() === y;
      });
      months.push({
        month: label,
        income: txs.filter((t) => t.type === "INCOME").reduce((a, b) => a + b.amount, 0),
        expense: txs.filter((t) => t.type === "EXPENSE").reduce((a, b) => a + b.amount, 0),
      });
    }
    return months;
  }, [transactions]);

  const { toast } = useToast();
  const recent = useMemo(() => [...transactions].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 5), [transactions]);

  function groupLabel(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const keyFmt = (dt: Date) => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Jakarta" }).format(dt);
    const k = keyFmt(d);
    if (k === keyFmt(now)) return "Hari ini";
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (k === keyFmt(y)) return "Kemarin";
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(d);
  }

  const groupedRecent = useMemo(() => {
    const map = new Map<string, typeof recent>();
    const order: string[] = [];
    for (const t of recent) {
      const lbl = groupLabel(t.date);
      if (!map.has(lbl)) { map.set(lbl, []); order.push(lbl); }
      map.get(lbl)!.push(t);
    }
    return order.map((label) => ({ label, items: map.get(label)! }));
  }, [recent]);

  const insight = useMemo(() => {
    if (barData.length < 2) return null;
    const cur = barData[barData.length - 1];
    const prev = barData[barData.length - 2];
    if (!prev.expense) return null;
    const pct = ((cur.expense - prev.expense) / prev.expense) * 100;
    if (Math.abs(pct) < 5) return null;
    return { pct: pct.toFixed(0), up: pct > 0, cur: cur.expense, prev: prev.expense };
  }, [barData]);

  async function handleAddTx(data: any) {
    try {
      await txHook.create({
        walletId: data.walletId,
        toWalletId: data.toWalletId || null,
        categoryId: data.categoryId || null,
        type: data.type,
        amount: Number(data.amount),
        description: data.description || null,
        date: data.date ? new Date(data.date) : new Date(),
      } as any);
      toast("Transaksi disimpan");
    } catch (e: any) {
      toast(e?.message || "Gagal menyimpan");
    }
  }

  const monthLabel = new Date(monthFilter.year, monthFilter.month, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const isLoading = !walletsHook.hydrated || walletsHook.loading || txHook.loading;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-[500] tracking-tight text-ink dark:text-[#e9e6e2]">Dashboard</h1>
          <p className="text-[13px] text-mute dark:text-[#a7a39d] mt-0.5">{monthLabel} · total saldo semua dompet {walletsHook.isDemo ? "· Demo" : ""}</p>
        </div>
        <TransactionForm wallets={wallets} categories={categories as any} onSubmit={handleAddTx} fab />
      </div>

      <Card className="rounded-[18px] overflow-hidden">
        <CardContent className="p-6">
          <div className="text-[11px] font-medium tracking-widest text-mute dark:text-[#8f8b85] uppercase">Total Saldo</div>
          <div className="mt-1 text-[30px] font-semibold tracking-tight leading-none num text-ink dark:text-[#e9e6e2]">{isLoading ? "—" : formatRupiah(totalSaldo)}</div>
          <div className="mt-5 grid grid-cols-3 gap-4 border-t hairline pt-5">
            <div>
              <div className="text-[11px] font-medium tracking-widest text-mute dark:text-[#8f8b85] uppercase">Masuk</div>
              <div className="mt-1 text-[14px] font-semibold tracking-tight num text-[#1a7a4a] dark:text-[#4ade80]">{formatRupiahCompact(incomeMonth)}</div>
              <div className="text-[11px] text-mute dark:text-[#8f8b85]">bulan ini</div>
            </div>
            <div className="border-l hairline pl-4">
              <div className="text-[11px] font-medium tracking-widest text-mute dark:text-[#8f8b85] uppercase">Keluar</div>
              <div className="mt-1 text-[14px] font-semibold tracking-tight num text-[#b42318] dark:text-[#fca5a5]">{formatRupiahCompact(expenseMonth)}</div>
              <div className="text-[11px] text-mute dark:text-[#8f8b85]">bulan ini</div>
            </div>
            <div className="border-l hairline pl-4">
              <div className="text-[11px] font-medium tracking-widest text-mute dark:text-[#8f8b85] uppercase">Sisa</div>
              <div className={`mt-1 text-[14px] font-semibold tracking-tight num ${sisaMonth < 0 ? "text-[#b42318] dark:text-[#fca5a5]" : sisaMonth > 0 ? "text-[#1a7a4a] dark:text-[#4ade80]" : "text-ink dark:text-[#e9e6e2]"}`}>{formatRupiahCompact(sisaMonth)}</div>
              <div className={`text-[11px] font-medium ${sisaMonth < 0 ? "text-[#b42318] dark:text-[#fca5a5]" : sisaMonth > 0 ? "text-[#1a7a4a] dark:text-[#4ade80]" : "text-mute dark:text-[#a7a39d]"}`}>{sisaMonth < 0 ? "minus" : "aman"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[12px] font-semibold tracking-wide text-mute dark:text-[#8f8b85] uppercase">Dompet</h2>
          <Link href="/dompet" className="text-[12px] font-medium text-ink dark:text-[#e9e6e2] hover:underline underline-offset-4 decoration-[#c9c5c0] dark:decoration-[#3a3a3a]">Kelola →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {balances.map(({ wallet, balance }) => (
            <WalletCard key={wallet.id} wallet={wallet as any} balance={balance} negative={balance < 0} />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pengeluaran per kategori</CardTitle>
          <CardDescription>{monthLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseDonut data={donutData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6 bulan terakhir</CardTitle>
          <CardDescription>Masuk vs keluar</CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyBar data={barData} />
        </CardContent>
      </Card>

      <Card className="overflow-visible">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-1.5"><Receipt className="h-4 w-4" strokeWidth={1.75} /> Transaksi terbaru</CardTitle>
            <CardDescription>5 terakhir · group per tanggal</CardDescription>
          </div>
          <Link href="/transaksi"><Button variant="outline" size="sm">Lihat semua</Button></Link>
        </CardHeader>
        <CardContent className="pt-0">
          {recent.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto h-10 w-10 rounded-xl bg-[#f3f1ec] dark:bg-[#1d1d1d] grid place-items-center text-mute dark:text-[#8f8b85] border hairline">—</div>
              <div className="text-[13px] font-medium text-mute dark:text-[#a7a39d] mt-2">Belum ada transaksi</div>
            </div>
          ) : (
            <div className="space-y-0">
              {groupedRecent.map((group) => (
                <div key={group.label}>
                  <div className="sticky top-0 z-[2] -mx-[18px] md:-mx-6 flex items-center justify-between border-y hairline bg-white dark:bg-[#1d1d1d] px-[18px] md:px-6 py-2">
                    <span className="kicker">{group.label}</span>
                    <span className="text-[11px] tabular-nums text-mute dark:text-[#8f8b85]">{group.items.length}</span>
                  </div>
                  <div className="space-y-2 py-3">
                    {group.items.map((t) => {
                      const cat = t.categoryId ? catMap.get(t.categoryId) : null;
                      const w = walletMap.get(t.walletId);
                      const toW = t.toWalletId ? walletMap.get(t.toWalletId) : null;
                      const isIncome = t.type === "INCOME";
                      const isExpense = t.type === "EXPENSE";
                      return (
                        <div key={t.id} className="flex items-center justify-between rounded-[14px] border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d] px-3.5 py-3 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 border hairline ${isIncome ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414]" : isExpense ? "bg-white dark:bg-[#1d1d1d] text-ink dark:text-[#e9e6e2]" : "bg-white dark:bg-[#1d1d1d] text-mute dark:text-[#a7a39d]"}`}>
                              {isIncome ? <ArrowUpCircle className="h-4 w-4" strokeWidth={2} /> : isExpense ? <ArrowDownCircle className="h-4 w-4" strokeWidth={2} /> : <ArrowLeftRight className="h-4 w-4" strokeWidth={2} />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold leading-tight tracking-tight truncate text-ink dark:text-[#e9e6e2]">{t.type === "TRANSFER" ? `Transfer ${w?.name} → ${toW?.name}` : cat?.name || t.description || "—"}</div>
                              <div className="text-[12px] text-mute dark:text-[#8f8b85] truncate">{t.description || w?.name} · {formatDateShort(t.date)}</div>
                            </div>
                          </div>
                          <div className={`text-[13px] font-semibold shrink-0 num ${isIncome ? "text-[#1a7a4a] dark:text-[#4ade80]" : isExpense ? "text-[#b42318] dark:text-[#fca5a5]" : "text-mute dark:text-[#a7a39d]"}`}>
                            {isIncome ? "+" : isExpense ? "−" : ""}{formatRupiah(t.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {insight && (
        <Card className="bg-[#f3f1ec] dark:bg-[#1d1d1d] border hairline">
          <CardContent className="p-5">
            <div className={`flex items-center gap-1.5 text-[12px] font-semibold ${insight.up ? "text-[#b42318] dark:text-[#fca5a5]" : "text-[#1a7a4a] dark:text-[#4ade80]"}`}>
              {insight.up ? <TrendingUp className="h-4 w-4" strokeWidth={1.75} /> : <TrendingDown className="h-4 w-4" strokeWidth={1.75} />} Insight
            </div>
            <div className="text-[13px] font-medium mt-1 text-ink dark:text-[#e9e6e2]">
              {insight.up ? `Pengeluaran naik ${insight.pct}% vs bulan lalu.` : `Pengeluaran turun ${Math.abs(Number(insight.pct))}% vs bulan lalu.`}
            </div>
            <div className="text-[12px] text-mute dark:text-[#8f8b85] mt-1">Lalu {formatRupiahCompact(insight.prev)} → Kini {formatRupiahCompact(insight.cur)}</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Anggaran bulan ini</CardTitle>
          <CardDescription>{budgets.length} kategori dilimit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {budgets.slice(0, 3).map((b) => {
            const cat = catMap.get(b.categoryId);
            const spent = monthTx.filter((t) => t.type === "EXPENSE" && t.categoryId === b.categoryId).reduce((a, v) => a + v.amount, 0);
            const pct = b.amount ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0;
            const over = spent > b.amount;
            const near = !over && pct >= 80;
            return (
              <div key={b.id}>
                <div className="flex justify-between text-[12px] mb-1.5">
                  <span className="font-semibold text-ink dark:text-[#e9e6e2]">{cat?.name}</span>
                  <span className={`num ${over ? "text-[#b42318] dark:text-[#fca5a5]" : near ? "text-[#a16207] dark:text-[#fcd34d]" : "text-mute dark:text-[#8f8b85]"}`}>{pct}% · {formatRupiahCompact(spent)} / {formatRupiahCompact(b.amount)}</span>
                </div>
                <Progress value={pct} indicatorClassName={over ? "bg-[#b42318] dark:bg-[#fca5a5]" : near ? "bg-[#a16207] dark:bg-[#fcd34d]" : undefined} />
              </div>
            );
          })}
          {budgets.length === 0 && <div className="text-[13px] text-mute dark:text-[#a7a39d]">Belum ada anggaran.</div>}
          <Link href="/anggaran" className="text-[12px] font-medium text-ink dark:text-[#e9e6e2] hover:underline underline-offset-4 decoration-[#c9c5c0] dark:decoration-[#3a3a3a]">Kelola anggaran →</Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5"><TargetIcon className="h-4 w-4" strokeWidth={1.75} /> Tujuan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {goals.slice(0, 2).map((g) => {
            const pct = g.targetAmount ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
            const done = g.currentAmount >= g.targetAmount;
            return (
              <div key={g.id} className="rounded-[14px] border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d] p-4">
                <div className="text-[13px] font-semibold tracking-tight text-ink dark:text-[#e9e6e2] flex items-center gap-1.5">{g.name} {done && <span className="text-[10px] font-medium bg-[#1a7a4a] dark:bg-[#4ade80]/80 text-white dark:text-[#141414] border hairline px-1.5 py-0.5 rounded-full">selesai</span>}</div>
                <div className={`text-[12px] num ${done ? "text-[#1a7a4a] dark:text-[#4ade80]" : "text-mute dark:text-[#8f8b85]"}`}>{formatRupiahCompact(g.currentAmount)} / {formatRupiahCompact(g.targetAmount)}</div>
                <Progress value={pct} className="mt-3" indicatorClassName={done ? "bg-[#1a7a4a] dark:bg-[#4ade80]" : undefined} />
                <div className={`text-[11px] font-medium mt-1.5 num ${done ? "text-[#1a7a4a] dark:text-[#4ade80]" : "text-mute dark:text-[#8f8b85]"}`}>{pct}%</div>
              </div>
            );
          })}
          <Link href="/tujuan" className="text-[12px] font-medium text-ink dark:text-[#e9e6e2] hover:underline underline-offset-4 decoration-[#c9c5c0] dark:decoration-[#3a3a3a]">Lihat semua tujuan →</Link>
        </CardContent>
      </Card>
    </div>
  );
}
