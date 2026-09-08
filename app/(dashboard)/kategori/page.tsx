"use client";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHero, HeroChip, HeroCircle, HeroDots, SectionHead } from "@/components/page-hero";
import { Ticker } from "@/components/ticker";
import { useCategories, useTransactions, useBudgets } from "@/lib/use-data";
import { useToast } from "@/components/ui/toast";
import { Plus, Trash2, Pencil, Tag, Briefcase, Utensils, Car, ShoppingBag, Receipt, Film, Heart, Laptop, Wallet, Landmark, Smartphone, TrendingUp, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, type CategoryInput } from "@/lib/validations";

const ICON_OPTIONS = [
  { v: "tag", label: "tag", Icon: Tag },
  { v: "briefcase", label: "briefcase", Icon: Briefcase },
  { v: "laptop", label: "laptop", Icon: Laptop },
  { v: "utensils", label: "utensils", Icon: Utensils },
  { v: "car", label: "car", Icon: Car },
  { v: "shopping-bag", label: "shopping-bag", Icon: ShoppingBag },
  { v: "receipt", label: "receipt", Icon: Receipt },
  { v: "film", label: "film", Icon: Film },
  { v: "heart", label: "heart", Icon: Heart },
  { v: "wallet", label: "wallet", Icon: Wallet },
  { v: "landmark", label: "landmark", Icon: Landmark },
  { v: "smartphone", label: "smartphone", Icon: Smartphone },
  { v: "trending-up", label: "trending-up", Icon: TrendingUp },
  { v: "package", label: "package", Icon: Package },
] as const;

function IconFor({ name, className }: { name: string; className?: string }) {
  const found = ICON_OPTIONS.find((o) => o.v === name);
  const I = found?.Icon || Tag;
  return <I className={className} strokeWidth={1.75} />;
}

export default function KategoriPage() {
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
  const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema) as any,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { name: "", type: "EXPENSE" as any, color: "#1a1a1a", icon: "tag" },
  });

  const filtered = useMemo(() => {
    if (filterType === "ALL") return categories;
    return categories.filter((c) => c.type === filterType);
  }, [categories, filterType]);

  const grouped = useMemo(() => {
    const inc = filtered.filter((c) => c.type === "INCOME");
    const exp = filtered.filter((c) => c.type === "EXPENSE");
    return { inc, exp };
  }, [filtered]);

  function openCreate(prefType: "INCOME" | "EXPENSE" = "EXPENSE") {
    setEditing(null);
    form.reset({ name: "", type: prefType as any, color: prefType === "INCOME" ? "#1a7a4a" : "#1a1a1a", icon: "tag" });
    setOpen(true);
  }
  function openEdit(id: string) {
    const c = categories.find((x) => x.id === id);
    if (!c) return;
    if (c.isSystem && !catsHook.isDemo) {
      toast("Kategori default tidak bisa diubah — duplikat dengan nama lain");
      return;
    }
    setEditing(id);
    form.reset({ name: c.name, type: c.type as any, color: c.color, icon: c.icon });
    setOpen(true);
  }

  async function handleSubmit(data: CategoryInput) {
    const wasEditing = !!editing;
    try {
      if (editing) {
        await catsHook.update(editing, { name: data.name, type: data.type as any, color: data.color, icon: data.icon });
      } else {
        await catsHook.create({ name: data.name, type: data.type as any, color: data.color, icon: data.icon });
      }
      setOpen(false);
      toast(wasEditing ? "Kategori diperbarui" : "Kategori ditambah");
    } catch (e: any) {
      toast(e?.message || "Gagal menyimpan kategori");
    }
  }

  async function handleDelete(id: string) {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    if (cat.isSystem && !catsHook.isDemo) {
      toast("Kategori default tidak bisa dihapus");
      return;
    }
    const usedTx = transactions.some((t) => t.categoryId === id);
    const usedBudget = budgets.some((b) => b.categoryId === id);
    if (usedTx || usedBudget) {
      toast("Kategori masih dipakai transaksi/anggaran — hapus/pindahkan dulu");
      return;
    }
    setConfirmId(id);
  }

  async function confirmDelete() {
    const id = confirmId;
    if (!id) return;
    const removed = categories.find((c) => c.id === id);
    if (!removed) return;
    const idx = categories.findIndex((c) => c.id === id);
    setConfirmId(null);
    try {
      await catsHook.remove(id);
      toastUndo("Kategori dihapus", async () => {
        try {
          if (catsHook.isDemo) {
            catsHook.setData((prev: any) => {
              const next = [...prev];
              next.splice(idx, 0, removed as any);
              return next;
            });
          } else {
            await catsHook.create({ name: removed.name, type: removed.type as any, color: removed.color, icon: removed.icon });
          }
        } catch {}
      }, 10000);
    } catch (e: any) {
      toast(e?.message || "Gagal menghapus kategori");
    }
  }

  const isLoading = !catsHook.hydrated || catsHook.loading;

  const inc = categories.filter((c) => c.type === "INCOME");
  const exp = categories.filter((c) => c.type === "EXPENSE");

  return (
    <div className="space-y-5">
      <PageHero
        title={
          <>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
              Kasih nama, <HeroDots />
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-1.5">
              <HeroChip>biar</HeroChip>
              <HeroCircle>ke baca.</HeroCircle>
            </span>
          </>
        }
        desc={
          <>
            <strong className="font-semibold text-ink dark:text-[#e9e6e2] num">{categories.length} kategori</strong> ·{" "}
            <strong className="font-semibold text-ink dark:text-[#e9e6e2] num">{exp.length} keluar</strong> ·{" "}
            <strong className="font-semibold text-ink dark:text-[#e9e6e2] num">{inc.length} masuk</strong>. Pill transaksi ikut warna kategori.
          </>
        }
        actions={<Button onClick={() => openCreate()}><Plus className="h-4 w-4" strokeWidth={1.75} /> Tambah kategori</Button>}
      />

      <Ticker items={[
        `${categories.length} kategori`,
        `${exp.length} keluar`,
        `${inc.length} masuk`,
        ...filtered.slice(0, 4).map((c) => c.name),
      ]} />

      <div>
        <SectionHead
          kicker="Saring"
          title={
            <>Lihat yang <span className="italic">perlu.</span></>
          }
        />
        <div className="mt-3 inline-flex gap-1 rounded-full bg-[#f3f1ec] dark:bg-[#1d1d1d] p-1 border hairline">
        {[
          { v: "ALL", label: "Semua" },
          { v: "EXPENSE", label: "Keluar" },
          { v: "INCOME", label: "Masuk" },
        ].map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => setFilterType(o.v as any)}
            className={`press rounded-full px-3.5 py-1.5 text-xs font-medium ${filterType === o.v ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414]" : "text-mute dark:text-[#8f8b85]"}`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Card className="border hairline"><CardContent className="p-10 text-center text-[13px] text-mute">Memuat…</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card className="border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d]"><CardContent className="p-10 text-center"><div className="mx-auto h-10 w-10 rounded-xl bg-white dark:bg-[#141414] grid place-items-center text-mute dark:text-[#8f8b85] border hairline"><Tag className="h-5 w-5" strokeWidth={1.75} /></div><div className="kicker mt-3">Kosong</div><div className="text-[13px] font-medium text-mute dark:text-[#a7a39d] mt-1">Belum ada kategori {filterType === "INCOME" ? "pemasukan" : filterType === "EXPENSE" ? "pengeluaran" : ""}</div><Button size="sm" className="mt-4" onClick={() => openCreate(filterType === "ALL" ? "EXPENSE" : filterType as any)}><Plus className="h-4 w-4" strokeWidth={1.75} /> Tambah kategori</Button></CardContent></Card>
      ) : (
        <div className="space-y-6">
          {(filterType === "ALL" || filterType === "EXPENSE") && grouped.exp.length > 0 && (
            <div>
              <SectionHead
                kicker="Keluar"
                title={
                  <>Pergi ke <HeroChip>mana.</HeroChip></>
                }
                desc={`${grouped.exp.length} kategori`}
              />
              <div className="mt-2.5 grid gap-2">
                {grouped.exp.map((c) => {
                  const readOnly = c.isSystem && !catsHook.isDemo;
                  return (
                    <Card key={c.id} className={readOnly ? "opacity-90" : "card-hover"}>
                      <CardContent className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-xl grid place-items-center shrink-0 border hairline bg-white dark:bg-[#1d1d1d]" style={{ color: c.color }}>
                            <IconFor name={c.icon} className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold leading-tight tracking-tight flex items-center gap-1.5 text-ink dark:text-[#e9e6e2]">
                              <span className="truncate">{c.name}</span>
                              {readOnly && <span className="text-[10px] font-medium bg-[#f3f1ec] dark:bg-[#222] text-mute dark:text-[#8f8b85] border hairline px-1.5 py-0.5 rounded-full shrink-0">default</span>}
                            </div>
                            <div className="text-[11px] text-mute dark:text-[#8f8b85] flex items-center gap-1.5"><span className="h-2 w-2 rounded-full shrink-0" style={{ background: c.color }} />{c.icon} · {c.type}</div>
                          </div>
                        </div>
                        {!readOnly && (
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c.id)} aria-label="Edit"><Pencil className="h-4 w-4" strokeWidth={1.75} /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(c.id)} aria-label="Hapus"><Trash2 className="h-4 w-4" strokeWidth={1.75} /></Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
          {(filterType === "ALL" || filterType === "INCOME") && grouped.inc.length > 0 && (
            <div>
              <SectionHead
                kicker="Masuk"
                title={
                  <>Datang dari <span className="italic">mana.</span></>
                }
                desc={`${grouped.inc.length} kategori`}
              />
              <div className="mt-2.5 grid gap-2">
                {grouped.inc.map((c) => {
                  const readOnly = c.isSystem && !catsHook.isDemo;
                  return (
                    <Card key={c.id} className={readOnly ? "opacity-90" : "card-hover"}>
                      <CardContent className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-xl grid place-items-center shrink-0 border hairline bg-white dark:bg-[#1d1d1d]" style={{ color: c.color }}>
                            <IconFor name={c.icon} className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold leading-tight tracking-tight flex items-center gap-1.5 text-ink dark:text-[#e9e6e2]">
                              <span className="truncate">{c.name}</span>
                              {readOnly && <span className="text-[10px] font-medium bg-[#f3f1ec] dark:bg-[#222] text-mute dark:text-[#8f8b85] border hairline px-1.5 py-0.5 rounded-full shrink-0">default</span>}
                            </div>
                            <div className="text-[11px] text-mute dark:text-[#8f8b85] flex items-center gap-1.5"><span className="h-2 w-2 rounded-full shrink-0" style={{ background: c.color }} />{c.icon} · {c.type}</div>
                          </div>
                        </div>
                        {!readOnly && (
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c.id)} aria-label="Edit"><Pencil className="h-4 w-4" strokeWidth={1.75} /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(c.id)} aria-label="Hapus"><Trash2 className="h-4 w-4" strokeWidth={1.75} /></Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      {catsHook.error && <div className="text-[12px] text-[#b42318] dark:text-[#fca5a5]">{catsHook.error}</div>}

      {/* Form bottom-sheet */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-[420px] p-0 overflow-hidden border-0 sm:border hairline flex flex-col max-h-[85dvh] sm:max-h-[90vh] rounded-t-[20px] sm:rounded-[18px]">
          <div className="shrink-0 px-6 pt-6 pb-3">
            <DialogHeader className="mb-0"><DialogTitle>{editing ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle><p className="text-[12px] text-mute dark:text-[#8f8b85]">{editing ? "Ubah nama/warna/icon." : "Bikin kategori baru — pilih tipe dulu."}</p></DialogHeader>
            <div className="inline-flex gap-1 rounded-full bg-[#f3f1ec] dark:bg-[#1d1d1d] p-1 border hairline mt-4">
              {[
                { v: "EXPENSE", label: "Keluar" },
                { v: "INCOME", label: "Masuk" },
              ].map((o) => (
                <button key={o.v} type="button" onClick={() => form.setValue("type", o.v as any)} className={`press rounded-full px-3.5 py-1.5 text-xs font-medium ${form.watch("type") === o.v ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414]" : "text-mute dark:text-[#8f8b85]"}`}>{o.label}</button>
              ))}
            </div>
          </div>
          <form onSubmit={form.handleSubmit(handleSubmit as any)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-auto overscroll-contain px-6 space-y-4 pb-4">
              <div className="space-y-1.5">
                <Label>Nama Kategori</Label>
                <Input placeholder="Makan, Gaji freelance..." {...form.register("name")} className="h-11" autoFocus />
                {form.formState.errors.name && <p className="text-xs font-medium text-[#b42318] dark:text-[#fca5a5]">{form.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Warna</Label>
                  <Input type="color" className="h-11 p-1" {...form.register("color")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Icon</Label>
                  <Select value={form.watch("icon")} onChange={(e) => form.setValue("icon", e.target.value)} className="h-11">
                    {ICON_OPTIONS.map((o) => <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>)}
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-[12px] border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d] p-3">
                <div className="h-9 w-9 rounded-xl grid place-items-center shrink-0 border hairline bg-white dark:bg-[#1d1d1d]" style={{ color: form.watch("color") || "#1a1a1a" }}>
                  <IconFor name={form.watch("icon") || "tag"} className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">{form.watch("name") || "Preview"}</div>
                  <div className="text-[11px] text-mute">{form.watch("type")} · {form.watch("icon")}</div>
                </div>
                <span className="ml-auto h-3 w-3 rounded-full shrink-0 border hairline" style={{ background: form.watch("color") || "#1a1a1a" }} />
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

      {/* Confirm delete */}
      <Dialog open={!!confirmId} onOpenChange={(o) => { if (!o) setConfirmId(null); }}>
        <DialogContent onClose={() => setConfirmId(null)} className="max-w-[380px]">
          <DialogHeader><DialogTitle>Hapus kategori?</DialogTitle><p className="text-[13px] leading-relaxed text-mute dark:text-[#a7a39d]">Yakin hapus <span className="font-semibold text-ink dark:text-[#e9e6e2]">{categories.find((c) => c.id === confirmId)?.name}</span>? Tindakan ini tidak bisa dibatalkan (bisa Urungkan 10 detik).</p></DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 h-11" onClick={() => setConfirmId(null)}>Batal</Button>
            <Button className="flex-1 h-11 bg-[#b42318] hover:bg-[#991b1b] text-white dark:bg-[#fca5a5] dark:text-[#141414] dark:hover:bg-[#f87171]" onClick={confirmDelete}>Hapus</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
