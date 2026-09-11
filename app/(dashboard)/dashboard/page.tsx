"use client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/skeletons";
import { LoadWatchdog } from "@/components/load-watchdog";
import { Progress } from "@/components/ui/progress";
import { ExpenseDonut } from "@/components/charts/expense-donut";
import { MonthlyBar } from "@/components/charts/monthly-bar";
import { TransactionForm } from "@/components/transaction-form";
import { WalletCard } from "@/components/wallet-card";
import { PageHero, HeroPill, HeroItalic, HeroCoin, SectionHead } from "@/components/page-hero";
import { Ticker } from "@/components/ticker";
import { formatRupiah, formatRupiahCompact, formatDateShort } from "@/lib/utils";
import { useWallets, useCategories, useTransactions, useBudgets, useGoals } from "@/lib/use-data";
import { useToast } from "@/components/ui/toast";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, TrendingUp, TrendingDown, Check, Zap } from "lucide-react";
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

  const DAILY_LIMIT = 20000;
  const today = useMemo(() => {
    const keyFmt = (dt: Date) => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Jakarta" }).format(dt);
    const now = new Date();
    const spent = transactions
      .filter((t) => t.type === "EXPENSE" && keyFmt(new Date(t.date)) === keyFmt(now))
      .reduce((a, b) => a + b.amount, 0);
    const sisa = DAILY_LIMIT - spent;
    return { spent, sisa, pct: Math.min(100, Math.round((spent / DAILY_LIMIT) * 100)), over: sisa < 0, near: sisa >= 0 && sisa <= DAILY_LIMIT * 0.2 };
  }, [transactions]);

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
      toast("Transaksi kesimpan");
    } catch (e: any) {
      toast(e?.message || "Gagal nyimpen");
    }
  }

  const monthLabel = new Date(monthFilter.year, monthFilter.month, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  // Semua query harus settle sebelum render angka — kalau cuma wallets+transactions,
  // Masuk/Keluar/Sisa flash "Rp 0" dan list flash "Belum ada transaksi" padahal data lagi jalan.
  const isLoading =
    !walletsHook.hydrated || walletsHook.loading ||
    txHook.loading || catsHook.loading || budgetsHook.loading || goalsHook.loading;

  const onboardingStep = useMemo(() => {
    const s1 = wallets.length > 0;
    const s2 = categories.length > 0;
    const s3 = transactions.length > 0;
    const done = [s1, s2, s3].filter(Boolean).length;
    return { s1, s2, s3, done, show: walletsHook.hydrated && !s1 };
  }, [wallets.length, categories.length, transactions.length, walletsHook.hydrated]);

  const tickerItems = useMemo(() => {
    const items = [
      `${monthLabel} · ${wallets.length} dompet`,
      `Masuk ${formatRupiahCompact(incomeMonth)}`,
      `Keluar ${formatRupiahCompact(expenseMonth)}`,
      `Sisa ${formatRupiahCompact(sisaMonth)}`,
    ];
    for (const d of donutData.slice(0, 3)) items.push(`${d.name} ${formatRupiahCompact(d.value)}`);
    items.push(`${transactions.length} transaksi tercatat`);
    return items;
  }, [monthLabel, wallets.length, incomeMonth, expenseMonth, sisaMonth, donutData, transactions.length]);

  const spark = useMemo(() => {
    const vals = barData.map((b) => b.expense);
    const max = Math.max(1, ...vals);
    const W = 200;
    const H = 48;
    const pts = vals.map((v, i) => {
      const x = vals.length === 1 ? W : (i / (vals.length - 1)) * W;
      const y = H - 6 - (v / max) * (H - 14);
      return [x, y] as const;
    });
    if (pts.length === 0) return { path: "", end: [W, 8] as const };
    let d = `M0 ${H - 10}`;
    pts.forEach(([x, y], i) => {
      if (i === 0) d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      else {
        const [px, py] = pts[i - 1];
        const cx = (px + x) / 2;
        d += ` C ${cx.toFixed(1)} ${py.toFixed(1)}, ${cx.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    });
    return { path: d, end: pts[pts.length - 1] };
  }, [barData]);

  // Watchdog anti skeleton-infinite: kalau query belum settle > 12 dtk
  // (sesi mati / DB unreachable / flag demo basi), tampilkan panel recovery
  // dengan tombol Coba lagi / Muat ulang / Logout — bukan skeleton selamanya.
  const watchdogSources = [
    { key: "wallets", label: "Dompet", done: walletsHook.hydrated && !walletsHook.loading, failed: !!walletsHook.error },
    { key: "categories", label: "Kategori", done: catsHook.hydrated && !catsHook.loading, failed: !!catsHook.error },
    { key: "transactions", label: "Transaksi", done: txHook.hydrated && !txHook.loading, failed: !!txHook.error },
    { key: "budgets", label: "Anggaran", done: budgetsHook.hydrated && !budgetsHook.loading, failed: !!budgetsHook.error },
    { key: "goals", label: "Tujuan", done: goalsHook.hydrated && !goalsHook.loading, failed: !!goalsHook.error },
  ];

  function handleWatchdogRetry() {
    walletsHook.refresh();
    catsHook.refresh();
    txHook.refresh();
    budgetsHook.refresh();
    goalsHook.refresh();
  }

  // First load: tampilkan skeleton full-page (layout sama persis dengan konten asli)
  // biar gak ada flash "—" / "Rp 0" / empty state sebelum query settle.
  // Watchdog ikut dirender di atas skeleton biar kasus macet ada jalan keluar.
  if (isLoading)
    return (
      <div className="space-y-5">
        <LoadWatchdog sources={watchdogSources} onRetry={handleWatchdogRetry} />
        <DashboardSkeleton />
      </div>
    );

  return (
    <div className="space-y-5 content-in">
      <PageHero
        title={
          <>
            Duit bulan ini,
            <br />
            <span className="mt-2 inline-flex flex-wrap items-center gap-x-2.5 gap-y-2">
              <HeroPill>jelas</HeroPill>
              <HeroItalic>terpantau.</HeroItalic>
              <HeroCoin compact />
            </span>
          </>
        }
        desc={
          <>
            Total saldo <strong className="font-semibold text-ink dark:text-[#e9e6e2] num">{formatRupiah(totalSaldo)}</strong>{" "}
            · masuk <strong className="font-semibold text-ink dark:text-[#e9e6e2] num">{formatRupiahCompact(incomeMonth)}</strong>, keluar{" "}
            <strong className="font-semibold text-ink dark:text-[#e9e6e2] num">{formatRupiahCompact(expenseMonth)}</strong>. Nggak ada yang ganggu.
          </>
        }
        meta={[
          `${wallets.length} dompet aktif`,
          `${monthTx.length} transaksi bulan ini`,
          sisaMonth < 0 ? "Bulan ini tekor" : "Bulan ini aman",
        ].map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" strokeWidth={2.25} /> {t}
          </span>
        ))}
      />

      <Ticker items={tickerItems} />

      {onboardingStep.show && (
        <Card className="border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d] overflow-hidden">
          <CardContent className="p-5">
            <div className="kicker">Mulai 3 langkah</div>
            <div className="text-[14px] font-semibold tracking-tight text-ink dark:text-[#e9e6e2] mt-1">Beresin dulu biar nyatet &lt;10 detik</div>
            <div className="text-[12px] text-mute dark:text-[#8f8b85] mt-0.5">Udah {onboardingStep.done}/3 · beresin biar dashboard-nya hidup</div>
            <div className="mt-4 grid gap-2">
              <Link href="/dompet" className="flex items-center justify-between rounded-[12px] border hairline bg-white dark:bg-[#141414] p-3 hover:border-ink dark:hover:border-[#3a3a3a] transition-colors">
                <span className="flex items-center gap-2.5"><span className={`h-7 w-7 rounded-full grid place-items-center text-[11px] font-bold border hairline shrink-0 ${onboardingStep.s1 ? "bg-[#1a7a4a] text-white border-[#1a7a4a] dark:bg-[#4ade80] dark:text-[#141414] dark:border-[#4ade80]" : "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414]"}`}>{onboardingStep.s1 ? "✓" : "1"}</span><span className="text-[13px] font-medium text-ink dark:text-[#e9e6e2]">Buat dompet</span><span className="text-[11px] text-mute dark:text-[#8f8b85] hidden sm:inline">BCA / Cash / GoPay</span></span><span className="text-mute dark:text-[#8f8b85]">→</span>
              </Link>
              <Link href="/kategori" className="flex items-center justify-between rounded-[12px] border hairline bg-white dark:bg-[#141414] p-3 hover:border-ink dark:hover:border-[#3a3a3a] transition-colors">
                <span className="flex items-center gap-2.5"><span className={`h-7 w-7 rounded-full grid place-items-center text-[11px] font-bold border hairline shrink-0 ${onboardingStep.s2 ? "bg-[#1a7a4a] text-white border-[#1a7a4a] dark:bg-[#4ade80] dark:text-[#141414] dark:border-[#4ade80]" : "bg-white dark:bg-[#1d1d1d] text-mute dark:text-[#8f8b85]"}`}>{onboardingStep.s2 ? "✓" : "2"}</span><span className="text-[13px] font-medium text-ink dark:text-[#e9e6e2]">Cek kategori</span><span className="text-[11px] text-mute dark:text-[#8f8b85] hidden sm:inline">Makan, Transport… tambah sendiri kalau kurang</span></span><span className="text-mute dark:text-[#8f8b85]">→</span>
              </Link>
              <div className="flex items-center justify-between rounded-[12px] border hairline bg-white dark:bg-[#141414] p-3">
                <span className="flex items-center gap-2.5"><span className={`h-7 w-7 rounded-full grid place-items-center text-[11px] font-bold border hairline shrink-0 ${onboardingStep.s3 ? "bg-[#1a7a4a] text-white border-[#1a7a4a] dark:bg-[#4ade80] dark:text-[#141414] dark:border-[#4ade80]" : "bg-white dark:bg-[#1d1d1d] text-mute dark:text-[#8f8b85]"}`}>{onboardingStep.s3 ? "✓" : "3"}</span><span className="text-[13px] font-medium text-ink dark:text-[#e9e6e2]">Catat transaksi pertama</span><span className="text-[11px] text-mute dark:text-[#8f8b85] hidden sm:inline">Nominal, kategori, simpan — beres</span></span><TransactionForm wallets={wallets} categories={categories as any} onSubmit={handleAddTx} triggerLabel="Coba" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* panel saldo — inverted ink ala demo landing, flat biar gak banding */}
      <div className="relative overflow-hidden rounded-[18px] bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] p-5 panel-shadow">
        <div className="relative flex items-center justify-between gap-2">
          <div className="text-[11px] font-medium tracking-[0.12em] uppercase opacity-70">Total Saldo · {monthLabel}</div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 dark:bg-black/10 px-2 py-0.5 text-[11px] font-semibold num">
              <Zap className="h-3 w-3" strokeWidth={2.25} /> {monthTx.length} trx
            </span>
          </div>
        </div>
        <div className="relative mt-1 text-[28px] sm:text-[32px] font-semibold tracking-tight leading-none num">{formatRupiah(totalSaldo)}</div>
        <svg viewBox="0 0 200 48" className="relative mt-3 h-12 w-full" fill="none" aria-hidden>
          <path
            d={spark.path}
            stroke="currentColor"
            strokeOpacity="0.9"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx={spark.end[0]} cy={spark.end[1]} r="3.5" fill="currentColor" />
        </svg>
        <div className="relative mt-3 grid grid-cols-3 gap-3 text-[11px] border-t border-white/15 dark:border-black/15 pt-3">
          <div className="min-w-0"><div className="tracking-[0.1em] opacity-60 truncate">MASUK</div><div className="font-semibold mt-0.5 num text-[13px] truncate">{formatRupiahCompact(incomeMonth)}</div></div>
          <div className="border-l border-white/15 dark:border-black/15 pl-3 min-w-0"><div className="tracking-[0.1em] opacity-60 truncate">KELUAR</div><div className="font-semibold mt-0.5 num text-[13px] truncate">{formatRupiahCompact(expenseMonth)}</div></div>
          <div className="border-l border-white/15 dark:border-black/15 pl-3 min-w-0"><div className="tracking-[0.1em] opacity-60 truncate">SISA</div><div className="font-semibold mt-0.5 num text-[13px] truncate">{formatRupiahCompact(sisaMonth)} · {sisaMonth < 0 ? "minus" : "aman"}</div></div>
        </div>
      </div>

      {/* limit harian — tracking sekilas */}
      <Card className="border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-medium tracking-widest text-mute dark:text-[#8f8b85] uppercase">Hari ini</div>
            <div className="text-[13px] font-semibold num text-ink dark:text-[#e9e6e2]">{formatRupiah(today.spent)} <span className="font-normal text-mute dark:text-[#8f8b85]">/ {formatRupiah(DAILY_LIMIT)}</span></div>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white dark:bg-[#141414] border hairline">
            <div className={`h-full rounded-full ${today.over ? "bg-[#b42318] dark:bg-[#fca5a5]" : today.near ? "bg-[#a16207] dark:bg-[#fcd34d]" : "bg-[#1a7a4a] dark:bg-[#4ade80]"}`} style={{ width: `${today.pct}%` }} />
          </div>
          <div className="mt-2 text-[12px] text-mute dark:text-[#8f8b85]">
            {today.spent === 0 ? "Belum jajan apa-apa hari ini." : today.over ? `Jebol ${formatRupiah(-today.sisa)} — rem besok.` : `Sisa ${formatRupiah(today.sisa)} buat hari ini.`}
          </div>
        </CardContent>
      </Card>

      <div>
        <SectionHead
          kicker="Dompet"
          title={
            <>Saldo dipisah, <span className="italic">rapi.</span></>
          }
          action={<Link href="/dompet" className="text-[12px] font-medium text-ink dark:text-[#e9e6e2] hover:underline underline-offset-4 decoration-[#c9c5c0] dark:decoration-[#3a3a3a]">Kelola →</Link>}
        />
        <div className="mt-3 grid grid-cols-2 gap-3">
          {balances.map(({ wallet, balance }, i) => (
            <WalletCard key={wallet.id} wallet={wallet as any} balance={balance} negative={balance < 0} className={`content-in stagger-${Math.min(i, 5) + 1}`} />
          ))}
        </div>
      </div>

      <Card className="border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d]">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium tracking-widest text-mute dark:text-[#8f8b85] uppercase">Kategori</div>
            <div className="text-[13px] font-medium text-ink dark:text-[#e9e6e2] mt-0.5">{categories.length} kategori · {categories.filter((c) => c.type === "EXPENSE").length} keluar · {categories.filter((c) => c.type === "INCOME").length} masuk</div>
            <div className="text-[11px] text-mute dark:text-[#8f8b85]">Atur warna & ikon biar transaksi gampang dibaca</div>
          </div>
          <Link href="/kategori"><Button size="sm" variant="outline">Kelola →</Button></Link>
        </CardContent>
      </Card>

      <div>
        <SectionHead
          kicker="Grafik jujur"
          title={
            <>Borosnya <HeroPill className="text-[15px] sm:text-[17px]">kelihatan.</HeroPill></>
          }
          desc={monthLabel}
        />
        <Card className="mt-3">
          <CardHeader>
            <CardTitle>Pengeluaran per kategori</CardTitle>
            <CardDescription>{monthLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseDonut data={donutData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>6 bulan terakhir</CardTitle>
          <CardDescription>Masuk vs keluar</CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyBar data={barData} />
        </CardContent>
      </Card>

      <div>
        <SectionHead
          kicker="Terbaru"
          title={
            <>Arus kas, <HeroItalic>apa adanya.</HeroItalic></>
          }
          desc="5 terakhir · dikelompokin per tanggal"
          action={<Link href="/transaksi"><Button variant="outline" size="sm">Lihat semua</Button></Link>}
        />
        <Card className="overflow-visible mt-3">
          <CardContent className="pt-4">
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
                      {group.items.map((t, ti) => {
                        const cat = t.categoryId ? catMap.get(t.categoryId) : null;
                        const w = walletMap.get(t.walletId);
                        const toW = t.toWalletId ? walletMap.get(t.toWalletId) : null;
                        const isIncome = t.type === "INCOME";
                        const isExpense = t.type === "EXPENSE";
                        return (
                          <div key={t.id} className={`flex items-center justify-between rounded-[14px] border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d] px-3.5 py-3 gap-3 content-in stagger-${Math.min(ti, 5) + 1}`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 border hairline ${isIncome ? "bg-white dark:bg-[#1d1d1d] text-[#1a7a4a] dark:text-[#4ade80]" : isExpense ? "bg-white dark:bg-[#1d1d1d] text-[#b42318] dark:text-[#fca5a5]" : "bg-white dark:bg-[#1d1d1d] text-mute dark:text-[#a7a39d]"}`}>
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
      </div>

      {insight && (
        <figure className="rounded-[18px] border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d] p-5">
          <div className={`flex items-center gap-1.5 text-[12px] font-semibold ${insight.up ? "text-[#b42318] dark:text-[#fca5a5]" : "text-[#1a7a4a] dark:text-[#4ade80]"}`}>
            {insight.up ? <TrendingUp className="h-4 w-4" strokeWidth={1.75} /> : <TrendingDown className="h-4 w-4" strokeWidth={1.75} />} Insight jujur
          </div>
          <blockquote className="mt-2.5 font-display text-[17px] leading-snug tracking-tight italic">
            {insight.up ? `Pengeluaran naik ${insight.pct}% dibanding bulan lalu.` : `Pengeluaran turun ${Math.abs(Number(insight.pct))}% dibanding bulan lalu.`}
          </blockquote>
          <figcaption className="text-[12px] text-mute dark:text-[#8f8b85] mt-1.5 num">Bulan lalu {formatRupiahCompact(insight.prev)} → sekarang {formatRupiahCompact(insight.cur)}</figcaption>
        </figure>
      )}

      <div>
        <SectionHead
          kicker="Limit bulanan"
          title={
            <>Anggaran, <span className="italic">aman.</span></>
          }
          desc={`${budgets.length} kategori dipasang limit`}
          action={<Link href="/anggaran" className="text-[12px] font-medium text-ink dark:text-[#e9e6e2] hover:underline underline-offset-4 decoration-[#c9c5c0] dark:decoration-[#3a3a3a]">Kelola →</Link>}
        />
        <Card className="mt-3">
          <CardContent className="pt-4 space-y-3">
            {budgets.slice(0, 3).map((b, bi) => {
              const cat = catMap.get(b.categoryId);
              const spent = monthTx.filter((t) => t.type === "EXPENSE" && t.categoryId === b.categoryId).reduce((a, v) => a + v.amount, 0);
              const pct = b.amount ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0;
              const over = spent > b.amount;
              const near = !over && pct >= 80;
              return (
                <div key={b.id} className={`content-in stagger-${Math.min(bi, 5) + 1}`}>
                  <div className="flex justify-between text-[12px] mb-1.5">
                    <span className="font-semibold text-ink dark:text-[#e9e6e2]">{cat?.name}</span>
                    <span className={`num ${over ? "text-[#b42318] dark:text-[#fca5a5]" : near ? "text-[#a16207] dark:text-[#fcd34d]" : "text-mute dark:text-[#8f8b85]"}`}>{pct}% · {formatRupiahCompact(spent)} / {formatRupiahCompact(b.amount)}</span>
                  </div>
                  <Progress value={pct} indicatorClassName={over ? "bg-[#b42318] dark:bg-[#fca5a5]" : near ? "bg-[#a16207] dark:bg-[#fcd34d]" : undefined} />
                </div>
              );
            })}
            {budgets.length === 0 && <div className="text-[13px] text-mute dark:text-[#a7a39d]">Belum pasang limit.</div>}
            <Link href="/anggaran" className="text-[12px] font-medium text-ink dark:text-[#e9e6e2] hover:underline underline-offset-4 decoration-[#c9c5c0] dark:decoration-[#3a3a3a]">Kelola anggaran →</Link>
          </CardContent>
        </Card>
      </div>

      <div>
        <SectionHead
          kicker="Nabung"
          title={
            <>Tujuan, <HeroPill className="text-[15px] sm:text-[17px]">kekejar.</HeroPill></>
          }
          desc={goals.length > 0 ? `${goals.length} target aktif` : "Belum ada target"}
          action={<Link href="/tujuan" className="text-[12px] font-medium text-ink dark:text-[#e9e6e2] hover:underline underline-offset-4 decoration-[#c9c5c0] dark:decoration-[#3a3a3a]">Lihat →</Link>}
        />
        <Card className="mt-3">
          <CardContent className="pt-4 space-y-3">
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

      <TransactionForm wallets={wallets} categories={categories as any} onSubmit={handleAddTx} fab />
    </div>
  );
}
