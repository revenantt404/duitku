"use client";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { RupiahInput } from "@/components/ui/rupiah-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHero, HeroSign, HeroShout, HeroGauge, SectionHead } from "@/components/page-hero";
import { Ticker } from "@/components/ticker";
import { useCategories, useTransactions, useBudgets } from "@/lib/use-data";
import { formatRupiahCompact } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { budgetSchema, type BudgetInput } from "@/lib/validations";

export default function AnggaranPage() {
  const catsHook = useCategories();
  const txHook = useTransactions();
  const budgetsHook = useBudgets();
  const categories = catsHook.data;
  const transactions = txHook.data;
  const budgets = budgetsHook.data;
  const { toast, toastUndo } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();
  const expenseCats = useMemo(() => categories.filter((c) => c.type === "EXPENSE"), [categories]);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const monthTx = useMemo(() => transactions.filter((t) => {
    const d = new Date(t.date);
    return t.type === "EXPENSE" && d.getMonth() + 1 === curMonth && d.getFullYear() === curYear;
  }), [transactions, curMonth, curYear]);
  const form = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema) as any,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { categoryId: expenseCats[0]?.id || "", amount: 1000000, month: curMonth, year: curYear },
  });
  function openCreate() {
    setEditing(null);
    form.reset({ categoryId: expenseCats[0]?.id || "", amount: 1000000, month: curMonth, year: curYear });
    setOpen(true);
  }
  function openEdit(id: string) {
    const b = budgets.find((x) => x.id === id);
    if (!b) return;
    setEditing(id);
    form.reset({ categoryId: b.categoryId, amount: b.amount, month: b.month, year: b.year });
    setOpen(true);
  }
  async function handleSubmit(data: BudgetInput) {
    const wasEditing = !!editing;
    const id = editing;
    const snapshot = { ...data };
    // Instant close: tutup modal dulu (0ms), sync ke server belakangan — pola sama kayak tambah transaksi.
    setOpen(false);
    setEditing(null);
    form.reset({ categoryId: expenseCats[0]?.id || "", amount: 1000000, month: curMonth, year: curYear });
    try {
      if (id) {
        await budgetsHook.update(id, { categoryId: snapshot.categoryId, amount: Number(snapshot.amount) });
      } else {
        await budgetsHook.create({ categoryId: snapshot.categoryId, amount: Number(snapshot.amount), month: curMonth, year: curYear });
      }
      toast(wasEditing ? "Limit udah diupdate" : "Limit baru kepasang");
    } catch (e: any) {
      toast(e?.message || "Gagal nyimpen limit");
    }
  }
  function requestDelete(id: string) { setConfirmId(id); }
  async function confirmDelete() {
    const id = confirmId;
    if (!id) return;
    const removed = budgets.find((b) => b.id === id);
    if (!removed) return;
    const idx = budgets.findIndex((b) => b.id === id);
    setConfirmId(null);
    try {
      await budgetsHook.remove(id);
      toastUndo("Limit dihapus", async () => {
        try {
          if (budgetsHook.isDemo) {
            budgetsHook.setData((prev: any) => {
              const next = [...prev];
              next.splice(idx, 0, removed as any);
              return next;
            });
          } else {
            await budgetsHook.create({ categoryId: removed.categoryId, amount: removed.amount, month: removed.month, year: removed.year } as any);
          }
        } catch {}
      }, 10000);
    } catch (e: any) {
      toast(e?.message || "Gagal hapus limit");
    }
  }
  const rows = useMemo(() => {
    return budgets
      .filter((b) => b.month === curMonth && b.year === curYear)
      .map((b) => {
        const spent = monthTx.filter((t) => t.categoryId === b.categoryId).reduce((a, v) => a + v.amount, 0);
        const pct = b.amount ? Math.min(150, Math.round((spent / b.amount) * 100)) : 0;
        const cat = catMap.get(b.categoryId);
        return { budget: b, spent, pct, cat, over: spent > b.amount };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, monthTx, catMap, curMonth, curYear]);
  const totalBudget = rows.reduce((a, r) => a + r.budget.amount, 0);
  const totalSpent = rows.reduce((a, r) => a + r.spent, 0);
  const isLoading = !budgetsHook.hydrated || budgetsHook.loading;

  const periodLabel = new Date(curYear, curMonth - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const jebol = rows.filter((r) => r.over).length;
  const tickerItems = useMemo(() => {
    const items = [
      `${periodLabel} · ${rows.length} limit`,
      `Total ${formatRupiahCompact(totalBudget)}`,
      `Terpakai ${formatRupiahCompact(totalSpent)}`,
      `Sisa ${formatRupiahCompact(totalBudget - totalSpent)}`,
    ];
    for (const r of rows.slice(0, 3)) items.push(`${r.cat?.name || "Limit"} ${r.pct}%`);
    return items;
  }, [periodLabel, rows, totalBudget, totalSpent]);

  return (
    <div className="space-y-5 content-in">
      <PageHero
        title={
          <>
            <HeroShout>
              Rem dulu,
              <br />
              sebelum jebol.
            </HeroShout>
            <br />
            <span className="mt-3 inline-flex flex-wrap items-center gap-x-2.5 gap-y-2">
              <HeroSign>awas limit</HeroSign>
              <HeroGauge />
            </span>
          </>
        }
        desc={
          <>
            Terpakai <strong className="font-semibold text-ink dark:text-[#e9e6e2] num">{isLoading ? "—" : formatRupiahCompact(totalSpent)}</strong> dari{" "}
            <strong className="font-semibold text-ink dark:text-[#e9e6e2] num">{isLoading ? "—" : formatRupiahCompact(totalBudget)}</strong>
            {jebol > 0 ? <> · <strong className="font-semibold text-[#b42318] dark:text-[#fca5a5] num">{jebol} jebol</strong></> : " · semua aman"}.
          </>
        }
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" strokeWidth={1.75} /> Tambah anggaran</Button>}
      />

      <Ticker items={tickerItems} />

      <div>
        <SectionHead
          kicker="Ringkasan"
          title={
            <>Bulan ini, <span className="italic">segini.</span></>
          }
          desc={periodLabel}
        />
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Card className="text-center min-w-0"><CardContent className="p-3 sm:p-4 min-w-0"><div className="text-[10px] sm:text-[11px] font-medium tracking-widest text-mute dark:text-[#8f8b85] uppercase truncate">Total</div><div className="text-[14px] font-semibold mt-1 num truncate text-ink dark:text-[#e9e6e2]">{isLoading ? "—" : formatRupiahCompact(totalBudget)}</div></CardContent></Card>
          <Card className="text-center min-w-0"><CardContent className="p-3 sm:p-4 min-w-0"><div className="text-[10px] sm:text-[11px] font-medium tracking-widest text-mute dark:text-[#8f8b85] uppercase truncate">Terpakai</div><div className="text-[14px] font-semibold mt-1 num truncate text-ink dark:text-[#e9e6e2]">{isLoading ? "—" : formatRupiahCompact(totalSpent)}</div></CardContent></Card>
          <Card className="text-center min-w-0"><CardContent className="p-3 sm:p-4 min-w-0"><div className="text-[10px] sm:text-[11px] font-medium tracking-widest text-mute dark:text-[#8f8b85] uppercase truncate">Sisa</div><div className="text-[14px] font-semibold mt-1 num truncate text-ink dark:text-[#e9e6e2]">{isLoading ? "—" : formatRupiahCompact(totalBudget - totalSpent)}</div></CardContent></Card>
        </div>
      </div>

      <div>
        <SectionHead
          kicker="Per kategori"
          title={
            <>Limit, <span className="italic">satu-satu.</span></>
          }
          desc={`${rows.length} limit · ${jebol} jebol`}
        />
        <div className="mt-3 grid gap-3">
          {isLoading ? (
            <Card className="border hairline"><CardContent className="p-10 text-center text-[13px] text-mute">Memuat…</CardContent></Card>
          ) : rows.map(({ budget, spent, pct, cat, over }, i) => {
            const nearLimit = !over && pct >= 80;
            return (
              <Card key={budget.id} className={`${over ? "border-ink dark:border-[#e9e6e2] bg-[#f3f1ec] dark:bg-[#1d1d1d]" : "card-hover"} content-in stagger-${Math.min(i, 5) + 1}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl grid place-items-center shrink-0 bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] border hairline">
                        <span className="text-[11px] font-bold">{cat?.name.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold leading-tight tracking-tight flex items-center gap-1.5 text-ink dark:text-[#e9e6e2]">
                          <span className="truncate">{cat?.name || budget.categoryId}</span>
                          {over && <span className="text-[11px] font-medium bg-[#b42318] text-white dark:bg-[#fca5a5] dark:text-[#141414] border hairline px-2 py-0.5 rounded-full shrink-0">jebol</span>}
                          {nearLimit && <span className="text-[11px] font-medium bg-white dark:bg-[#1d1d1d] text-[#a16207] dark:text-[#fcd34d] border hairline px-2 py-0.5 rounded-full shrink-0">80%</span>}
                        </div>
                        <div className={`text-[12px] num ${over ? "text-[#b42318] dark:text-[#fca5a5]" : nearLimit ? "text-[#a16207] dark:text-[#fcd34d]" : "text-mute dark:text-[#8f8b85]"}`}>{formatRupiahCompact(spent)} / {formatRupiahCompact(budget.amount)} · {pct}%</div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(budget.id)}><Pencil className="h-4 w-4" strokeWidth={1.75} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => requestDelete(budget.id)}><Trash2 className="h-4 w-4" strokeWidth={1.75} /></Button>
                    </div>
                  </div>
                  <Progress value={Math.min(100, pct)} className="mt-4" indicatorClassName={over ? "bg-[#b42318] dark:bg-[#fca5a5]" : nearLimit ? "bg-[#a16207] dark:bg-[#fcd34d]" : undefined} />
                  {over && <div className="text-[12px] font-medium text-[#b42318] dark:text-[#fca5a5] mt-2">Melebihi limit · kurangi pengeluaran kategori ini</div>}
                </CardContent>
              </Card>
            );
          })}
          {!isLoading && rows.length === 0 && (
            <Card className="border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d]"><CardContent className="p-10 text-center"><div className="mx-auto h-10 w-10 rounded-xl bg-white dark:bg-[#141414] grid place-items-center text-mute dark:text-[#8f8b85] border hairline">—</div><div className="kicker mt-3">Kosong</div><div className="text-[13px] font-medium text-mute dark:text-[#a7a39d] mt-1">Belum ada anggaran bulan ini</div><div className="text-[12px] text-mute dark:text-[#8f8b85] mt-1">Tambah limit untuk Makan, Transport, dll</div><Button size="sm" className="mt-4" onClick={openCreate}><Plus className="h-4 w-4" strokeWidth={1.75} /> Tambah anggaran</Button></CardContent></Card>
          )}
          {budgetsHook.error && <div className="text-[12px] text-[#b42318] dark:text-[#fca5a5]">{budgetsHook.error}</div>}
        </div>
      </div>

      <figure className="rounded-[18px] border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d] p-5">
        <div className="kicker">Cara pakai</div>
        <blockquote className="mt-2.5 font-display text-[16px] leading-snug tracking-tight italic">
          “Set limit, biar nafsu ada remnya.”
        </blockquote>
        <figcaption className="text-[13px] leading-relaxed text-mute dark:text-[#a7a39d] mt-1.5">Progress warm — jebol ditandai badge. Di Supabase disimpan per (user, kategori, bulan, tahun).</figcaption>
      </figure>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-[420px] p-0 overflow-hidden border-0 sm:border hairline flex flex-col max-h-[85dvh] sm:max-h-[90vh] rounded-t-[20px] sm:rounded-[18px]">
          <div className="shrink-0 px-6 pt-6 pb-3">
            <DialogHeader className="mb-0"><DialogTitle>{editing ? "Edit Anggaran" : "Tambah Anggaran"}</DialogTitle><p className="text-[12px] text-mute dark:text-[#8f8b85]">Limit per kategori · periode {new Date(curYear, curMonth - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })} otomatis</p></DialogHeader>
          </div>
          <form onSubmit={form.handleSubmit(handleSubmit as any)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-auto overscroll-contain px-6 space-y-4 pb-4">
              <div className="space-y-1.5">
                <Label>Kategori — Pengeluaran</Label>
                <Select value={form.watch("categoryId")} onChange={(e) => form.setValue("categoryId", e.target.value)} className="h-11">
                  {expenseCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Limit — Rp</Label>
                <RupiahInput
                  value={typeof form.watch("amount") === "number" ? (form.watch("amount") as number) : undefined}
                  onValueChange={(v) => { form.setValue("amount", v as any, { shouldValidate: form.formState.isSubmitted }); if (form.formState.isSubmitted) form.trigger("amount"); }}
                  className="h-11 text-[13px] font-semibold num"
                  placeholder="0"
                  inputMode="numeric"
                  autoFocus
                  aria-invalid={!!(form.formState.isSubmitted && form.formState.errors.amount)}
                />
                {form.formState.isSubmitted && form.formState.errors.amount && <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">{form.formState.errors.amount.message as string}</p>}
              </div>
            </div>
            <div className="shrink-0 sticky bottom-0 bg-white dark:bg-[#1d1d1d] border-t hairline px-6 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] mt-2">
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setOpen(false)}>Batal</Button>
                <Button type="submit" className="flex-1 h-11">{editing ? "Simpan" : "Tambah"}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmId} onOpenChange={(o) => { if (!o) setConfirmId(null); }}>
        <DialogContent onClose={() => setConfirmId(null)} className="max-w-[380px]">
          <DialogHeader><DialogTitle>Hapus anggaran?</DialogTitle><p className="text-[13px] leading-relaxed text-mute dark:text-[#a7a39d]">Yakin hapus anggaran <span className="font-semibold text-ink dark:text-[#e9e6e2]">{budgets.find((b) => b.id === confirmId) ? (catMap.get(budgets.find((b) => b.id === confirmId)!.categoryId)?.name || "ini") : ""}</span>? Bisa diurungkan 10 detik.</p></DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 h-11" onClick={() => setConfirmId(null)}>Batal</Button>
            <Button className="flex-1 h-11 bg-[#b42318] hover:bg-[#991b1b] text-white dark:bg-[#fca5a5] dark:text-[#141414] dark:hover:bg-[#f87171]" onClick={confirmDelete}>Hapus</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
