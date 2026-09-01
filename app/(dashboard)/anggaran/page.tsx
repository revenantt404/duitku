"use client";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { RupiahInput } from "@/components/ui/rupiah-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    try {
      if (editing) {
        await budgetsHook.update(editing, { categoryId: data.categoryId, amount: Number(data.amount) });
      } else {
        await budgetsHook.create({ categoryId: data.categoryId, amount: Number(data.amount), month: curMonth, year: curYear });
      }
      setOpen(false);
      toast(wasEditing ? "Anggaran diperbarui" : "Anggaran ditambah");
    } catch (e: any) {
      toast(e?.message || "Gagal menyimpan anggaran");
    }
  }
  async function handleDelete(id: string) {
    const removed = budgets.find((b) => b.id === id);
    if (!removed) return;
    const idx = budgets.findIndex((b) => b.id === id);
    try {
      await budgetsHook.remove(id);
      toastUndo("Anggaran dihapus", async () => {
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
      });
    } catch (e: any) {
      toast(e?.message || "Gagal menghapus anggaran");
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

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-[500] tracking-tight text-ink dark:text-[#e9e6e2]">Anggaran</h1>
          <p className="text-[13px] text-mute dark:text-[#a7a39d] mt-0.5">
            {new Date(curYear, curMonth - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })} · limit per kategori {budgetsHook.isDemo ? "· Demo" : ""}
          </p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" strokeWidth={1.75} /> Tambah</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center"><CardContent className="p-4"><div className="text-[11px] font-medium tracking-widest text-mute dark:text-[#8f8b85] uppercase">Total</div><div className="text-[14px] font-semibold mt-1 num truncate text-ink dark:text-[#e9e6e2]">{isLoading ? "—" : formatRupiahCompact(totalBudget)}</div></CardContent></Card>
        <Card className="text-center"><CardContent className="p-4"><div className="text-[11px] font-medium tracking-widest text-mute dark:text-[#8f8b85] uppercase">Terpakai</div><div className="text-[14px] font-semibold mt-1 num truncate text-ink dark:text-[#e9e6e2]">{isLoading ? "—" : formatRupiahCompact(totalSpent)}</div></CardContent></Card>
        <Card className="text-center"><CardContent className="p-4"><div className="text-[11px] font-medium tracking-widest text-mute dark:text-[#8f8b85] uppercase">Sisa</div><div className="text-[14px] font-semibold mt-1 num truncate text-ink dark:text-[#e9e6e2]">{isLoading ? "—" : formatRupiahCompact(totalBudget - totalSpent)}</div></CardContent></Card>
      </div>

      <div className="grid gap-3">
        {isLoading ? (
          <Card className="border hairline"><CardContent className="p-10 text-center text-[13px] text-mute">Memuat…</CardContent></Card>
        ) : rows.map(({ budget, spent, pct, cat, over }) => {
          const nearLimit = !over && pct >= 80;
          return (
          <Card key={budget.id} className={over ? "border-ink dark:border-[#e9e6e2] bg-[#f3f1ec] dark:bg-[#1d1d1d]" : "card-hover"}>
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
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(budget.id)}><Trash2 className="h-4 w-4" strokeWidth={1.75} /></Button>
                </div>
              </div>
              <Progress value={Math.min(100, pct)} className="mt-4" indicatorClassName={over ? "bg-[#b42318] dark:bg-[#fca5a5]" : nearLimit ? "bg-[#a16207] dark:bg-[#fcd34d]" : undefined} />
              {over && <div className="text-[12px] font-medium text-[#b42318] dark:text-[#fca5a5] mt-2">Melebihi limit · kurangi pengeluaran kategori ini</div>}
            </CardContent>
          </Card>
        );})}
        {!isLoading && rows.length === 0 && (
          <Card className="border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d]"><CardContent className="p-10 text-center"><div className="mx-auto h-10 w-10 rounded-xl bg-white dark:bg-[#141414] grid place-items-center text-mute dark:text-[#8f8b85] border hairline">—</div><div className="kicker mt-3">Kosong</div><div className="text-[13px] font-medium text-mute dark:text-[#a7a39d] mt-1">Belum ada anggaran bulan ini</div><div className="text-[12px] text-mute dark:text-[#8f8b85]">Tambah limit untuk Makan, Transport, dll</div></CardContent></Card>
        )}
        {budgetsHook.error && <div className="text-[12px] text-[#b42318] dark:text-[#fca5a5]">{budgetsHook.error}</div>}
      </div>

      <Card className="bg-[#f3f1ec] dark:bg-[#1d1d1d] border hairline">
        <CardContent className="p-5">
          <div className="text-[13px] font-semibold tracking-tight text-ink dark:text-[#e9e6e2]">Cara pakai</div>
          <div className="text-[13px] leading-relaxed text-mute dark:text-[#a7a39d] mt-1">Set limit per kategori. Progress warm — jebol ditandai badge ink. Di Supabase disimpan per (user, kategori, bulan, tahun).</div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-[420px]">
          <DialogHeader><DialogTitle>{editing ? "Edit Anggaran" : "Tambah Anggaran"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Kategori — Pengeluaran</Label>
              <Select value={form.watch("categoryId")} onChange={(e) => form.setValue("categoryId", e.target.value)}>
                {expenseCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Limit — Rp</Label>
              <RupiahInput
                value={typeof form.watch("amount") === "number" ? (form.watch("amount") as number) : undefined}
                onValueChange={(v) => { form.setValue("amount", v as any, { shouldValidate: form.formState.isSubmitted }); if (form.formState.isSubmitted) form.trigger("amount"); }}
                className="h-9 text-[13px] font-semibold num"
                placeholder="0"
                aria-invalid={!!(form.formState.isSubmitted && form.formState.errors.amount)}
              />
              {form.formState.isSubmitted && form.formState.errors.amount && <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">{form.formState.errors.amount.message as string}</p>}
            </div>
            <div className="text-[12px] text-mute dark:text-[#8f8b85]">Periode: {new Date(curYear, curMonth - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })} — otomatis</div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="flex-1">{editing ? "Simpan" : "Tambah"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
