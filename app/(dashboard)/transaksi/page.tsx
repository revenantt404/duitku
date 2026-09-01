"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transaction-form";
import { useWallets, useCategories, useTransactions } from "@/lib/use-data";
import { formatRupiah, formatDateShort, cn } from "@/lib/utils";
import { RupiahInput } from "@/components/ui/rupiah-input";
import { DateInput } from "@/components/ui/date-input";
import { useToast } from "@/components/ui/toast";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Trash2, Search, Pencil, Copy, X, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema, type TransactionInput } from "@/lib/validations";
import { buildTransactionCsvRows, downloadCsv } from "@/lib/csv";
import Link from "next/link";

export default function TransaksiPage() {
  const walletsHook = useWallets();
  const catsHook = useCategories();
  const txHook = useTransactions();
  const wallets = walletsHook.data;
  const categories = catsHook.data;
  const transactions = txHook.data;
  const { toast, toastUndo } = useToast();
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE" | "TRANSFER">("ALL");
  const [filterWallet, setFilterWallet] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [editTx, setEditTx] = useState<any | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const typeScrollRef = useRef<HTMLDivElement>(null);
  const walletScrollRef = useRef<HTMLDivElement>(null);
  const catScrollRef = useRef<HTMLDivElement>(null);
  const onWheelH = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollWidth > el.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };
  const onDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const startX = e.pageX - el.offsetLeft;
    const startScroll = el.scrollLeft;
    const onMove = (ev: MouseEvent) => {
      const x = ev.pageX - el.offsetLeft;
      el.scrollLeft = startScroll - (x - startX);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      el.style.cursor = "";
      el.style.userSelect = "";
    };
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const walletMap = useMemo(() => new Map(wallets.map((w) => [w.id, w])), [wallets]);

  const editForm = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema) as any,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { type: "EXPENSE" as any, amount: 0 as any, walletId: "", toWalletId: "", categoryId: "", description: "", date: new Date() as any },
  });
  const editType = editForm.watch("type");
  const editWalletId = editForm.watch("walletId");

  useEffect(() => {
    if (!editTx) return;
    editForm.reset({
      type: editTx.type as any,
      amount: editTx.amount as any,
      walletId: editTx.walletId as any,
      toWalletId: (editTx.toWalletId || "") as any,
      categoryId: (editTx.categoryId || "") as any,
      description: (editTx.description || "") as any,
      date: new Date(editTx.date) as any,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTx]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== "ALL" && t.type !== filterType) return false;
      if (filterWallet !== "ALL" && t.walletId !== filterWallet && t.toWalletId !== filterWallet) return false;
      if (filterCategory !== "ALL" && t.categoryId !== filterCategory) return false;
      if (filterMonth) {
        const [y, m] = filterMonth.split("-").map(Number);
        const d = new Date(t.date);
        if (d.getFullYear() !== y || d.getMonth() + 1 !== m) return false;
      }
      if (q) {
        const hay = `${t.description || ""} ${catMap.get(t.categoryId || "")?.name || ""} ${walletMap.get(t.walletId)?.name || ""} ${t.toWalletId ? walletMap.get(t.toWalletId)?.name || "" : ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    }).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [transactions, filterType, filterWallet, filterCategory, filterMonth, q, catMap, walletMap]);

  const visibleCategories = useMemo(() => {
    if (filterType === "TRANSFER") return [];
    if (filterType === "ALL") return categories;
    return categories.filter((c) => c.type === filterType);
  }, [categories, filterType]);

  const summary = useMemo(() => {
    const income = filtered.filter((t) => t.type === "INCOME").reduce((a, b) => a + b.amount, 0);
    const expense = filtered.filter((t) => t.type === "EXPENSE").reduce((a, b) => a + b.amount, 0);
    return { income, expense, count: filtered.length };
  }, [filtered]);

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

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    const order: string[] = [];
    for (const t of filtered) {
      const lbl = groupLabel(t.date);
      if (!map.has(lbl)) { map.set(lbl, []); order.push(lbl); }
      map.get(lbl)!.push(t);
    }
    return order.map((label) => ({ label, items: map.get(label)! }));
  }, [filtered]);

  async function handleAdd(data: any) {
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

  function requestDelete(id: string) { setConfirmId(id); }

  async function confirmDelete() {
    const id = confirmId;
    if (!id) return;
    const removed = transactions.find((t) => t.id === id);
    if (!removed) return;
    const idx = transactions.findIndex((t) => t.id === id);
    setConfirmId(null);
    try {
      await txHook.remove(id);
      toastUndo("Transaksi dihapus", async () => {
        try {
          if (txHook.isDemo) {
            txHook.setData((prev: any) => {
              const next = [...prev];
              next.splice(idx, 0, removed as any);
              return next;
            });
          } else {
            await txHook.create({
              walletId: removed.walletId,
              toWalletId: removed.toWalletId || null,
              categoryId: removed.categoryId || null,
              type: removed.type as any,
              amount: removed.amount,
              description: removed.description || null,
              date: new Date(removed.date) as any,
            } as any);
          }
        } catch {}
      }, 10000);
    } catch (e: any) {
      toast(e?.message || "Gagal menghapus");
    }
  }

  function handleExport() {
    if (filtered.length === 0) { toast("Tidak ada data untuk diekspor"); return; }
    const rows = buildTransactionCsvRows(filtered.map((t) => ({
      date: t.date,
      type: t.type,
      amount: t.amount,
      categoryName: t.categoryId ? (catMap.get(t.categoryId)?.name || "") : "",
      walletName: walletMap.get(t.walletId)?.name || "",
      toWalletName: t.toWalletId ? (walletMap.get(t.toWalletId)?.name || "") : "",
      description: t.description || "",
    })));
    const fname = `duitku-${filterMonth || new Date().toISOString().slice(0, 7)}.csv`;
    downloadCsv(fname, rows);
    toast(`CSV diekspor · ${filtered.length} baris`);
  }

  async function handleDuplicate(id: string) {
    try {
      await txHook.duplicate(id);
      toast("Transaksi diduplikasi");
    } catch (e: any) {
      toast(e?.message || "Gagal duplikasi");
    }
  }

  async function handleEditSave(data: TransactionInput) {
    if (!editTx) return;
    const prev = transactions.find((t) => t.id === editTx.id);
    const snapshot = prev ? { ...prev } : null;
    try {
      await txHook.update(editTx.id, {
        walletId: data.walletId,
        toWalletId: data.toWalletId || null,
        categoryId: data.categoryId || null,
        type: data.type as any,
        amount: Number(data.amount),
        description: data.description || null,
        date: data.date ? new Date(data.date as any) : new Date(editTx.date),
      } as any);
      setEditTx(null);
      toastUndo("Transaksi diperbarui", async () => {
        if (!snapshot) return;
        try {
          await txHook.update((snapshot as any).id ? (snapshot as any).id : editTx.id, {
            walletId: (snapshot as any).walletId,
            toWalletId: (snapshot as any).toWalletId,
            categoryId: (snapshot as any).categoryId,
            type: (snapshot as any).type,
            amount: (snapshot as any).amount,
            description: (snapshot as any).description,
            date: new Date((snapshot as any).date) as any,
          } as any);
        } catch {
          if (txHook.isDemo) {
            txHook.setData((curr: any) => curr.map((t: any) => t.id === (snapshot as any).id ? snapshot : t));
          }
        }
      }, 10000);
    } catch (e: any) {
      toast(e?.message || "Gagal memperbarui");
    }
  }

  function highlight(text: string, query: string) {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);
    return (
      <>
        {before}
        <mark className="bg-[#f3f1ec] dark:bg-[#2a2a2a] text-ink dark:text-[#e9e6e2] rounded px-0.5 border hairline">{match}</mark>
        {after}
      </>
    );
  }

  const isLoading = !txHook.hydrated || txHook.loading;
  const emptyAll = transactions.length === 0 && !isLoading;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-[500] tracking-tight text-ink dark:text-[#e9e6e2]">Transaksi</h1>
          <p className="text-[13px] text-mute dark:text-[#a7a39d] mt-0.5">Filter per bulan · cari · hapus · edit 2-tap</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleExport} className="hidden sm:inline-flex"><Download className="h-3.5 w-3.5" strokeWidth={1.75} /> Ekspor</Button>
          <TransactionForm wallets={wallets} categories={categories as any} onSubmit={handleAdd} />
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-3 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute dark:text-[#8f8b85]" strokeWidth={1.75} />
            <Input placeholder="Cari: ayam, gaji, BCA..." className="pl-10 pr-10 h-10" value={q} onChange={(e) => setQ(e.target.value)} />
            {q && (
              <button type="button" onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-full border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d] text-mute dark:text-[#8f8b85]" aria-label="Hapus cari">
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-3 min-w-0">
            <div
              ref={typeScrollRef}
              onWheel={onWheelH}
              onMouseDown={onDragStart}
              className="overflow-x-auto overscroll-x-contain touch-pan-x -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
              style={{ WebkitOverflowScrolling: "touch" } as any}
            >
              <div className="inline-flex gap-1 rounded-full bg-[#f3f1ec] dark:bg-[#1d1d1d] p-1 border hairline w-max flex-nowrap pointer-events-auto">
                {[
                  { v: "ALL", label: "Semua" },
                  { v: "EXPENSE", label: "Keluar" },
                  { v: "INCOME", label: "Masuk" },
                  { v: "TRANSFER", label: "Transfer" },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => { setFilterType(o.v as any); setFilterCategory("ALL"); }}
                    className={cn(
                      "press shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium tracking-tight transition-[transform,colors]",
                      filterType === o.v ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414]" : "text-mute dark:text-[#8f8b85] hover:text-ink dark:hover:text-[#e9e6e2]"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <div
                ref={walletScrollRef}
                onWheel={onWheelH}
                onMouseDown={onDragStart}
                className="flex-1 min-w-0 overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
                style={{ WebkitOverflowScrolling: "touch" } as any}
              >
                <div className="inline-flex gap-1 rounded-full bg-white dark:bg-[#141414] p-1 border hairline w-max flex-nowrap pointer-events-auto">
                  <button type="button" onClick={() => setFilterWallet("ALL")} className={cn("press shrink-0 rounded-full px-3 py-1.5 text-xs font-medium", filterWallet === "ALL" ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414]" : "text-mute dark:text-[#8f8b85]")}>Semua dompet</button>
                  {wallets.map((w) => (
                    <button key={w.id} type="button" onClick={() => setFilterWallet(w.id)} className={cn("press shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border hairline", filterWallet === w.id ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] border-ink" : "bg-[#f3f1ec] dark:bg-[#1d1d1d] text-mute dark:text-[#a7a39d]")}>{w.name}</button>
                  ))}
                </div>
              </div>
              <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-[132px] sm:w-[148px] shrink-0" />
            </div>
            {visibleCategories.length > 0 && (
              <div
                ref={catScrollRef}
                onWheel={onWheelH}
                onMouseDown={onDragStart}
                className="group/category overflow-x-auto overscroll-x-contain touch-pan-x -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
                title="Geser: drag, scroll-wheel, atau Shift+scroll"
                style={{ WebkitOverflowScrolling: "touch" } as any}
              >
                <div className="flex items-center gap-1.5 w-max flex-nowrap pointer-events-auto">
                  <span className="text-[11px] font-medium tracking-widest uppercase text-mute dark:text-[#8f8b85] shrink-0 mr-1">Kategori</span>
                  <button
                    type="button"
                    onClick={() => setFilterCategory("ALL")}
                    className={cn("press shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border hairline", filterCategory === "ALL" ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] border-ink" : "bg-white dark:bg-[#141414] text-mute dark:text-[#8f8b85]")}
                  >
                    Semua
                  </button>
                  {visibleCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFilterCategory(c.id)}
                      className={cn("press shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border hairline", filterCategory === c.id ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] border-ink" : "bg-white dark:bg-[#141414] text-ink dark:text-[#e9e6e2]")}
                    >
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: filterCategory === c.id ? "#fff" : c.color }} />{c.name}
                    </button>
                  ))}
                  <Link href="/kategori" className="text-[11px] font-medium text-mute dark:text-[#8f8b85] hover:text-ink dark:hover:text-[#e9e6e2] underline underline-offset-4 shrink-0 ml-1">Atur →</Link>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 sm:hidden">
              <Button variant="outline" size="sm" onClick={handleExport} className="flex-1"><Download className="h-3.5 w-3.5" strokeWidth={1.75} /> Ekspor CSV ({filtered.length})</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center"><CardContent className="p-3 sm:p-4"><div className="text-[11px] font-medium tracking-widest text-mute dark:text-[#8f8b85] uppercase">Transaksi</div><div className="text-[15px] font-semibold mt-1 num text-ink dark:text-[#e9e6e2]">{isLoading ? "—" : summary.count}</div></CardContent></Card>
        <Card className="text-center"><CardContent className="p-3 sm:p-4"><div className="text-[11px] font-medium tracking-widest text-mute dark:text-[#8f8b85] uppercase">Masuk</div><div className="text-[13px] font-semibold mt-1 num truncate text-[#1a7a4a] dark:text-[#4ade80]" title={formatRupiah(summary.income)}>{summary.income >= 1000000 ? `Rp ${(summary.income/1000000).toFixed(1)} jt` : formatRupiah(summary.income)}</div></CardContent></Card>
        <Card className="text-center"><CardContent className="p-3 sm:p-4"><div className="text-[11px] font-medium tracking-widest text-mute dark:text-[#8f8b85] uppercase">Keluar</div><div className="text-[13px] font-semibold mt-1 num truncate text-[#b42318] dark:text-[#fca5a5]" title={formatRupiah(summary.expense)}>{summary.expense >= 1000000 ? `Rp ${(summary.expense/1000000).toFixed(1)} jt` : formatRupiah(summary.expense)}</div></CardContent></Card>
      </div>

      <Card className="overflow-visible">
        <CardHeader className="pb-3"><CardTitle>Daftar</CardTitle></CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="py-10 text-center text-[13px] text-mute dark:text-[#a7a39d]">Memuat…</div>
          ) : emptyAll ? (
            <div className="rounded-[14px] border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d] p-5">
              <div className="kicker">Mulai 3 langkah</div>
              <div className="text-[13px] font-semibold mt-1 text-ink dark:text-[#e9e6e2]">Belum ada transaksi — setup dulu biar seamless</div>
              <div className="mt-4 grid gap-2 text-[13px]">
                <div className="rounded-[12px] border hairline bg-white dark:bg-[#141414] p-3 flex items-center justify-between gap-3"><span><span className="font-semibold">1.</span> Buat dompet · BCA/Cash/GoPay</span><span className="h-6 w-6 rounded-full bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] grid place-items-center text-[11px]">→</span></div>
                <div className="rounded-[12px] border hairline bg-white dark:bg-[#141414] p-3 flex items-center justify-between gap-3"><span><span className="font-semibold">2.</span> Kategori ada default — tambah custom kalau perlu</span><Link href="/kategori" className="text-[11px] font-medium underline underline-offset-4">Atur kategori</Link></div>
                <div className="rounded-[12px] border hairline bg-white dark:bg-[#141414] p-3 flex items-center justify-between gap-3"><span><span className="font-semibold">3.</span> Tambah transaksi pertama</span><TransactionForm wallets={wallets} categories={categories as any} onSubmit={handleAdd} triggerLabel="Coba" /></div>
              </div>
              <div className="text-[12px] text-mute dark:text-[#8f8b85] mt-3">Setelah ini input cuma <span className="font-medium text-ink dark:text-[#e9e6e2]">&lt;10 detik</span> — nominal → kategori chip → simpan. Edit & duplikat 2-tap kalau salah.</div>
            </div>
          ) : grouped.length > 0 ? (
            <div className="space-y-0">
              {grouped.map((group) => (
                <div key={group.label}>
                  <div className="sticky top-0 z-[2] -mx-[18px] md:-mx-6 flex items-center justify-between border-y hairline bg-white dark:bg-[#1d1d1d] px-[18px] md:px-6 py-2">
                    <span className="kicker">{group.label}</span>
                    <span className="text-[11px] tabular-nums text-mute dark:text-[#8f8b85]">{group.items.length} transaksi</span>
                  </div>
                  <div className="space-y-2 py-3">
                    {group.items.map((t) => {
                      const cat = t.categoryId ? catMap.get(t.categoryId) : null;
                      const w = walletMap.get(t.walletId);
                      const toW = t.toWalletId ? walletMap.get(t.toWalletId) : null;
                      const isIncome = t.type === "INCOME";
                      const isExpense = t.type === "EXPENSE";
                      const title = t.type === "TRANSFER" ? `Transfer ${w?.name} → ${toW?.name}` : cat?.name || t.description || "Tanpa kategori";
                      return (
                        <div key={t.id} className="flex items-center justify-between rounded-[14px] border hairline bg-white dark:bg-[#1d1d1d] px-3.5 py-3 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 border hairline ${isIncome ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414]" : isExpense ? "bg-white dark:bg-[#1d1d1d] text-ink dark:text-[#e9e6e2]" : "bg-[#f3f1ec] dark:bg-[#222] text-mute dark:text-[#a7a39d]"}`}>
                              {isIncome ? <ArrowUpCircle className="h-4 w-4" strokeWidth={2} /> : isExpense ? <ArrowDownCircle className="h-4 w-4" strokeWidth={2} /> : <ArrowLeftRight className="h-4 w-4" strokeWidth={2} />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold leading-tight tracking-tight truncate text-ink dark:text-[#e9e6e2]">
                                {highlight(title, q)}
                                <span className="ml-1.5 hidden sm:inline"><Badge variant="secondary" className="text-[10px]">{t.type}</Badge></span>
                              </div>
                              <div className="text-[12px] text-mute dark:text-[#8f8b85] truncate">{t.description ? highlight(t.description, q) : "—"} · {w?.name}{toW ? ` → ${toW.name}` : ""} · {formatDateShort(t.date)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <div className={`hidden sm:block text-[13px] font-semibold num mr-1 ${isIncome ? "text-[#1a7a4a] dark:text-[#4ade80]" : isExpense ? "text-[#b42318] dark:text-[#fca5a5]" : "text-mute dark:text-[#a7a39d]"}`}>
                              {isIncome ? "+" : isExpense ? "−" : ""}{formatRupiah(t.amount)}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setEditTx(t)} className="h-8 w-8" aria-label="Edit"><Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDuplicate(t.id)} className="h-8 w-8" aria-label="Duplikat"><Copy className="h-3.5 w-3.5" strokeWidth={1.75} /></Button>
                            <Button variant="ghost" size="icon" onClick={() => requestDelete(t.id)} className="h-8 w-8" aria-label="Hapus"><Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /></Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <div className="mx-auto h-10 w-10 rounded-xl bg-[#f3f1ec] dark:bg-[#1d1d1d] grid place-items-center text-mute dark:text-[#8f8b85] border hairline">—</div>
              <div className="text-[13px] font-medium text-mute dark:text-[#a7a39d] mt-2">Tidak ada transaksi untuk filter ini</div>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => { setQ(""); setFilterType("ALL"); setFilterWallet("ALL"); setFilterCategory("ALL"); }}>Bersihkan filter</Button>
            </div>
          )}
          {txHook.error && <div className="mt-3 text-[12px] text-[#b42318] dark:text-[#fca5a5]">{txHook.error}</div>}
        </CardContent>
      </Card>

      <Dialog open={!!confirmId} onOpenChange={(o) => { if (!o) setConfirmId(null); }}>
        <DialogContent onClose={() => setConfirmId(null)} className="max-w-[380px]">
          <DialogHeader><DialogTitle>Hapus transaksi?</DialogTitle><p className="text-[13px] leading-relaxed text-mute dark:text-[#a7a39d]">Yakin hapus transaksi ini? Bisa diurungkan 10 detik.</p></DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 h-11" onClick={() => setConfirmId(null)}>Batal</Button>
            <Button className="flex-1 h-11 bg-[#b42318] hover:bg-[#991b1b] text-white dark:bg-[#fca5a5] dark:text-[#141414] dark:hover:bg-[#f87171]" onClick={confirmDelete}>Hapus</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTx} onOpenChange={(o) => { if (!o) setEditTx(null); }}>
        <DialogContent onClose={() => setEditTx(null)} className="max-w-[440px] p-0 overflow-hidden border-0 sm:border hairline flex flex-col max-h-[85dvh] sm:max-h-[90vh] rounded-t-[20px] sm:rounded-[18px]">
          <div className="shrink-0 px-6 pt-6 pb-3">
            <DialogHeader className="mb-0"><DialogTitle>Edit transaksi</DialogTitle><p className="text-[12px] text-mute dark:text-[#8f8b85]">Ubah nominal/kategori/dompet — 2-tap selesai.</p></DialogHeader>
            <div className="inline-flex gap-1 rounded-full bg-[#f3f1ec] dark:bg-[#1d1d1d] p-1 border hairline mt-4">
              {[
                { v: "EXPENSE", label: "Keluar" },
                { v: "INCOME", label: "Masuk" },
                { v: "TRANSFER", label: "Transfer" },
              ].map((t) => (
                <button key={t.v} type="button" onClick={() => { editForm.setValue("type", t.v as any); editForm.setValue("categoryId", ""); editForm.setValue("toWalletId", ""); }} className={cn("press rounded-full px-3.5 py-1.5 text-xs font-medium", editType === t.v ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414]" : "text-mute dark:text-[#8f8b85]")}>{t.label}</button>
              ))}
            </div>
          </div>
          <form onSubmit={editForm.handleSubmit(handleEditSave as any)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-auto overscroll-contain px-6 space-y-4 pb-4">
              <div className="space-y-1.5">
                <Label>Nominal — Rp</Label>
                <RupiahInput
                  value={typeof editForm.watch("amount") === "number" ? editForm.watch("amount") as number : undefined}
                  onValueChange={(v) => { editForm.setValue("amount", v as any, { shouldValidate: editForm.formState.isSubmitted }); if (editForm.formState.isSubmitted) editForm.trigger("amount"); }}
                  className="h-11 text-[16px] font-semibold tracking-tight num"
                  inputMode="numeric"
                  aria-invalid={!!(editForm.formState.isSubmitted && editForm.formState.errors.amount)}
                />
                {typeof editForm.watch("amount") === "number" && (editForm.watch("amount") as number) > 0 && (
                  <div className="text-[11px] text-mute dark:text-[#8f8b85] num">{formatRupiah(editForm.watch("amount") as number)}</div>
                )}
                {editForm.formState.isSubmitted && editForm.formState.errors.amount && <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">{editForm.formState.errors.amount.message as string}</p>}
              </div>

              {editType !== "TRANSFER" && (
                <div className="space-y-1.5">
                  <Label>Kategori</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.filter((c) => c.type === editType).map((c) => {
                      const active = editForm.watch("categoryId") === c.id;
                      return (
                        <button key={c.id} type="button" onClick={() => { editForm.setValue("categoryId", c.id, { shouldValidate: editForm.formState.isSubmitted }); if (editForm.formState.isSubmitted) editForm.trigger("categoryId"); }} className={cn("press flex items-center gap-2 rounded-[12px] border hairline px-3 py-2.5 text-left transition-colors", active ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] border-ink" : "bg-[#f3f1ec] dark:bg-[#1d1d1d] text-ink dark:text-[#e9e6e2] hover:bg-white dark:hover:bg-[#222]")}>
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: active ? "#fff" : c.color }} aria-hidden />
                          <span className="text-[12.5px] font-medium leading-none truncate">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {categories.filter((c) => c.type === editType).length === 0 && <p className="text-[12px] text-mute">Belum ada kategori.</p>}
                  {editForm.formState.isSubmitted && (editForm.formState.errors as any).categoryId && <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">{(editForm.formState.errors as any).categoryId.message as string}</p>}
                  <Select value={editForm.watch("categoryId") || ""} onChange={(e) => { editForm.setValue("categoryId", e.target.value, { shouldValidate: editForm.formState.isSubmitted }); if (editForm.formState.isSubmitted) editForm.trigger("categoryId"); }} className="sr-only" aria-hidden tabIndex={-1}><option value="">Pilih kategori</option>{categories.filter((c) => c.type === editType).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</Select>
                </div>
              )}

              {editType === "TRANSFER" ? (
                <div className="grid gap-3">
                  <div className="space-y-1.5">
                    <Label>Dari dompet</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {wallets.map((w) => {
                        const active = editForm.watch("walletId") === w.id;
                        return <button key={w.id} type="button" onClick={() => { editForm.setValue("walletId", w.id, { shouldValidate: editForm.formState.isSubmitted }); if (editForm.formState.isSubmitted) editForm.trigger("walletId"); }} className={cn("press flex items-center gap-2 rounded-[12px] border hairline px-3 py-2.5 text-left", active ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] border-ink" : "bg-white dark:bg-[#1d1d1d] text-mute dark:text-[#a7a39d] hover:bg-[#f3f1ec] dark:hover:bg-[#222]")}><span className="text-[12.5px] font-medium truncate">{w.name}</span></button>;
                      })}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tujuan</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {wallets.filter((w) => w.id !== editWalletId).map((w) => {
                        const active = editForm.watch("toWalletId") === w.id;
                        return <button key={w.id} type="button" onClick={() => { editForm.setValue("toWalletId", w.id, { shouldValidate: editForm.formState.isSubmitted }); if (editForm.formState.isSubmitted) editForm.trigger("toWalletId"); }} className={cn("press flex items-center gap-2 rounded-[12px] border hairline px-3 py-2.5 text-left", active ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] border-ink" : "bg-white dark:bg-[#1d1d1d] text-mute dark:text-[#a7a39d] hover:bg-[#f3f1ec] dark:hover:bg-[#222]")}><span className="text-[12.5px] font-medium truncate">{w.name}</span></button>;
                      })}
                    </div>
                    {editForm.formState.isSubmitted && (editForm.formState.errors as any).toWalletId && <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">{(editForm.formState.errors as any).toWalletId.message as string}</p>}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Dompet</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {wallets.map((w) => {
                      const active = editForm.watch("walletId") === w.id;
                      return <button key={w.id} type="button" onClick={() => { editForm.setValue("walletId", w.id, { shouldValidate: editForm.formState.isSubmitted }); if (editForm.formState.isSubmitted) editForm.trigger("walletId"); }} className={cn("press flex items-center gap-2 rounded-[12px] border hairline px-3 py-2.5 text-left", active ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] border-ink" : "bg-white dark:bg-[#1d1d1d] text-mute dark:text-[#a7a39d] hover:bg-[#f3f1ec] dark:hover:bg-[#222]")}><span className="text-[12.5px] font-medium truncate">{w.name}</span></button>;
                    })}
                  </div>
                  {editForm.formState.isSubmitted && (editForm.formState.errors as any).walletId && <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">{(editForm.formState.errors as any).walletId.message as string}</p>}
                  <Select value={editForm.watch("walletId")} onChange={(e) => { editForm.setValue("walletId", e.target.value, { shouldValidate: editForm.formState.isSubmitted }); if (editForm.formState.isSubmitted) editForm.trigger("walletId"); }} className="sr-only" aria-hidden tabIndex={-1}><option value="">Pilih dompet</option>{wallets.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Tanggal</Label>
                <DateInput value={editForm.watch("date") as any} onValueChange={(v) => editForm.setValue("date", v ? (new Date(`${v}T00:00:00`) as any) : (new Date() as any))} className="h-11" />
                <p className="text-[11px] text-mute dark:text-[#8f8b85]">WIB</p>
              </div>
              <div className="space-y-1.5">
                <Label>Catatan — opsional</Label>
                <Textarea {...editForm.register("description")} maxLength={100} />
              </div>
            </div>
            <div className="shrink-0 sticky bottom-0 bg-white dark:bg-[#1d1d1d] border-t hairline px-6 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] mt-2">
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setEditTx(null)}>Batal</Button>
                <Button type="submit" className="flex-1 h-11">Simpan perubahan</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
