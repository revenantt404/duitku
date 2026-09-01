"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RupiahInput } from "@/components/ui/rupiah-input";
import { DateInput } from "@/components/ui/date-input";
import { useGoals } from "@/lib/use-data";
import { formatRupiahCompact, formatDateShort, formatRupiah } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Plus, Trash2, Pencil, Target, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { goalSchema, type GoalInput } from "@/lib/validations";

export default function TujuanPage() {
  const goalsHook = useGoals();
  const goals = goalsHook.data;
  const { toast, toastUndo } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [topupById, setTopupById] = useState<Record<string, string>>({});

  const form = useForm<GoalInput>({
    resolver: zodResolver(goalSchema) as any,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { name: "", targetAmount: 1000000, currentAmount: 0, deadline: null as any, icon: "target", color: "#1a1a1a" },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: "", targetAmount: 1000000, currentAmount: 0, deadline: null as any, icon: "target", color: "#1a1a1a" });
    setOpen(true);
  }
  function openEdit(id: string) {
    const g = goals.find((x) => x.id === id);
    if (!g) return;
    setEditing(id);
    form.reset({
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      deadline: g.deadline ? (new Date(g.deadline) as any) : (null as any),
      icon: g.icon,
      color: g.color,
    });
    setOpen(true);
  }

  async function handleSubmit(data: GoalInput) {
    const payload = {
      name: data.name,
      targetAmount: Number(data.targetAmount),
      currentAmount: Number(data.currentAmount || 0),
      deadline: data.deadline ? new Date(data.deadline as any).toISOString() : null,
      icon: data.icon,
      color: data.color,
    };
    const wasEditing = !!editing;
    try {
      if (editing) await goalsHook.update(editing, payload as any);
      else await goalsHook.create(payload as any);
      setOpen(false);
      toast(wasEditing ? "Tujuan diperbarui" : "Tujuan ditambah");
    } catch (e: any) {
      toast(e?.message || "Gagal menyimpan tujuan");
    }
  }

  async function handleDelete(id: string) {
    const removed = goals.find((g) => g.id === id);
    if (!removed) return;
    const idx = goals.findIndex((g) => g.id === id);
    try {
      await goalsHook.remove(id);
      toastUndo("Tujuan dihapus", async () => {
        try {
          if (goalsHook.isDemo) {
            goalsHook.setData((prev: any) => {
              const next = [...prev];
              next.splice(idx, 0, removed as any);
              return next;
            });
          } else {
            await goalsHook.create({ name: removed.name, targetAmount: removed.targetAmount, currentAmount: removed.currentAmount, deadline: removed.deadline, icon: removed.icon, color: removed.color } as any);
          }
        } catch {}
      });
    } catch (e: any) {
      toast(e?.message || "Gagal menghapus");
    }
  }

  async function handleTopup(id: string) {
    const raw = (topupById[id] || "").replace(/[^0-9]/g, "");
    const amt = parseInt(raw, 10) || 0;
    if (amt <= 0) { toast("Nominal tidak valid"); return; }
    try {
      await goalsHook.topup(id, amt);
      setTopupById((prev) => ({ ...prev, [id]: "" }));
      toast(`Nabung ${formatRupiahCompact(amt)} ditambah`);
    } catch (e: any) {
      toast(e?.message || "Gagal nabung");
    }
  }

  const totalTarget = goals.reduce((a, g) => a + g.targetAmount, 0);
  const totalCurrent = goals.reduce((a, g) => a + g.currentAmount, 0);
  const isLoading = !goalsHook.hydrated || goalsHook.loading;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-[500] tracking-tight text-ink dark:text-[#e9e6e2]">Tujuan</h1>
          <p className="text-[13px] text-mute dark:text-[#a7a39d] mt-0.5">{isLoading ? "Memuat…" : `${goals.length} tujuan · `}<span className="num">{formatRupiahCompact(totalCurrent)} / {formatRupiahCompact(totalTarget)}</span></p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" strokeWidth={1.75} /> Tambah</Button>
      </div>

      <div className="grid gap-3">
        {isLoading ? (
          <Card className="border hairline"><CardContent className="p-10 text-center text-[13px] text-mute">Memuat…</CardContent></Card>
        ) : goals.map((g) => {
          const pct = g.targetAmount ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
          const done = g.currentAmount >= g.targetAmount;
          const sisa = Math.max(0, g.targetAmount - g.currentAmount);
          const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
          return (
            <Card key={g.id} className={done ? "border-ink dark:border-[#e9e6e2] bg-[#f3f1ec] dark:bg-[#1d1d1d]" : "card-hover"}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl grid place-items-center shrink-0 bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] border hairline">
                      <Target className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold leading-tight tracking-tight flex items-center gap-1.5 text-ink dark:text-[#e9e6e2]">
                        <span className="truncate">{g.name}</span> {done && <span className="text-[11px] font-medium bg-[#1a7a4a] dark:bg-[#4ade80]/80 text-white dark:text-[#141414] border hairline px-2 py-0.5 rounded-full shrink-0">selesai</span>}
                      </div>
                      <div className={`text-[12px] num ${done ? "text-[#1a7a4a] dark:text-[#4ade80]" : "text-mute dark:text-[#8f8b85]"}`}>{formatRupiahCompact(g.currentAmount)} / {formatRupiahCompact(g.targetAmount)} · {pct}%</div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(g.id)}><Pencil className="h-4 w-4" strokeWidth={1.75} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(g.id)}><Trash2 className="h-4 w-4" strokeWidth={1.75} /></Button>
                  </div>
                </div>

                <Progress value={pct} className="mt-4" indicatorClassName={done ? "bg-[#1a7a4a] dark:bg-[#4ade80]" : undefined} />

                <div className="mt-2 flex items-center justify-between text-[12px] gap-2">
                  <span className={`font-medium num ${done ? "text-[#1a7a4a] dark:text-[#4ade80]" : "text-mute dark:text-[#8f8b85]"}`}>{done ? "Tercapai" : `Sisa ${formatRupiahCompact(sisa)}`}</span>
                  {g.deadline && <span className="text-mute dark:text-[#8f8b85] flex items-center gap-1 shrink-0"><Calendar className="h-3.5 w-3.5" strokeWidth={1.75} /> {formatDateShort(g.deadline)}</span>}
                </div>

                {!done && (
                  <div className="mt-3 flex gap-2">
                    <div className="flex-1" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleTopup(g.id); } }}>
                      <RupiahInput
                        value={topupById[g.id] ? parseInt(topupById[g.id], 10) : undefined}
                        onValueChange={(v) => setTopupById((prev) => ({ ...prev, [g.id]: String(v || "") }))}
                        placeholder="0"
                        className="h-9 text-[13px] num"
                      />
                    </div>
                    <Button size="sm" className="h-9 shrink-0" onClick={() => handleTopup(g.id)}>
                      <Plus className="h-4 w-4" strokeWidth={1.75} /> Nabung
                    </Button>
                  </div>
                )}

                {g.deadline && !done && daysLeft !== null && (
                  <div className="mt-2 text-[12px] text-mute dark:text-[#8f8b85]">
                    {daysLeft < 0 ? `Terlewat ${Math.abs(daysLeft)} hari` : daysLeft === 0 ? "Hari ini deadline" : `${daysLeft} hari lagi`} · {formatDateShort(g.deadline)}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!isLoading && goals.length === 0 && (
        <Card className="border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d]"><CardContent className="p-10 text-center"><div className="mx-auto h-10 w-10 rounded-xl bg-white dark:bg-[#141414] grid place-items-center text-mute dark:text-[#8f8b85] border hairline"><Target className="h-5 w-5" strokeWidth={1.75} /></div><div className="kicker mt-3">Kosong</div><div className="text-[13px] font-medium text-mute dark:text-[#a7a39d] mt-1">Belum ada tujuan</div><div className="text-[12px] text-mute dark:text-[#8f8b85] mt-1">Bikin target nabung biar ada alasan buka DuitKu</div><Button size="sm" className="mt-4" onClick={openCreate}><Plus className="h-4 w-4" strokeWidth={1.75} /> Tambah tujuan</Button></CardContent></Card>
      )}
      {goalsHook.error && <div className="text-[12px] text-[#b42318] dark:text-[#fca5a5]">{goalsHook.error}</div>}

      <Card className="bg-[#f3f1ec] dark:bg-[#1d1d1d] border hairline">
        <CardContent className="p-5">
          <div className="text-[13px] font-semibold tracking-tight text-ink dark:text-[#e9e6e2]">Tips</div>
          <div className="text-[13px] leading-relaxed text-mute dark:text-[#a7a39d] mt-1">Pecah tujuan besar jadi kecil. 12jt → 1jt/bulan. Tombol Nabung nambah <code className="bg-white dark:bg-[#141414] border hairline rounded px-1.5 py-0.5 num">currentAmount</code> per card.</div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-[420px] p-0 overflow-hidden border-0 sm:border hairline flex flex-col max-h-[85dvh] sm:max-h-[90vh] rounded-t-[20px] sm:rounded-[18px]">
          <div className="shrink-0 px-6 pt-6 pb-3">
            <DialogHeader className="mb-0"><DialogTitle>{editing ? "Edit Tujuan" : "Tambah Tujuan"}</DialogTitle><p className="text-[12px] text-mute dark:text-[#8f8b85]">{editing ? "Ubah target & deadline." : "Bikin target nabung — pecah besar jadi kecil."}</p></DialogHeader>
          </div>
          <form onSubmit={form.handleSubmit(handleSubmit as any)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-auto overscroll-contain px-6 space-y-4 pb-4">
              <div className="space-y-1.5">
                <Label>Nama Tujuan</Label>
                <Input placeholder="iPhone 15, Dana Darurat..." {...form.register("name")} className="h-11" autoFocus />
                {form.formState.errors.name && <p className="text-xs font-medium text-ink dark:text-[#e9e6e2]">{form.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Target — Rp</Label>
                  <RupiahInput
                    value={typeof form.watch("targetAmount") === "number" ? (form.watch("targetAmount") as number) : undefined}
                    onValueChange={(v) => { form.setValue("targetAmount", v as any, { shouldValidate: form.formState.isSubmitted }); if (form.formState.isSubmitted) form.trigger("targetAmount"); }}
                    className="h-11 text-[13px] font-semibold num"
                    placeholder="0"
                    inputMode="numeric"
                    aria-invalid={!!(form.formState.isSubmitted && form.formState.errors.targetAmount)}
                  />
                  {form.formState.isSubmitted && form.formState.errors.targetAmount && <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">{form.formState.errors.targetAmount.message as string}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Terkumpul — Rp</Label>
                  <RupiahInput
                    value={typeof form.watch("currentAmount") === "number" ? (form.watch("currentAmount") as number) : undefined}
                    onValueChange={(v) => { form.setValue("currentAmount", (v ?? 0) as any, { shouldValidate: form.formState.isSubmitted }); if (form.formState.isSubmitted) form.trigger("currentAmount"); }}
                    className="h-11 text-[13px] font-semibold num"
                    placeholder="0"
                    inputMode="numeric"
                    aria-invalid={!!(form.formState.isSubmitted && form.formState.errors.currentAmount)}
                  />
                  {form.formState.isSubmitted && form.formState.errors.currentAmount && <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">{form.formState.errors.currentAmount.message as string}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Deadline — opsional</Label>
                  <DateInput
                    value={form.watch("deadline") as any}
                    onValueChange={(v) => form.setValue("deadline", v ? (new Date(`${v}T00:00:00`) as any) : (null as any))}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Warna</Label>
                  <Input type="color" className="h-11 p-1" {...form.register("color")} />
                </div>
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
    </div>
  );
}
