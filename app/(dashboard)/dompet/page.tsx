"use client";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WalletCard } from "@/components/wallet-card";
import { RupiahInput } from "@/components/ui/rupiah-input";
import { useWallets, useTransactions } from "@/lib/use-data";
import { formatRupiah } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Plus, Trash2, Pencil, Wallet } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { walletSchema, type WalletInput } from "@/lib/validations";

const TYPE_LABEL: Record<string, string> = { CASH: "Cash", BANK: "Bank", E_WALLET: "eWallet", INVESTMENT: "Investasi", OTHER: "Lainnya" };

export default function DompetPage() {
  const walletsHook = useWallets();
  const txHook = useTransactions();
  const wallets = walletsHook.data;
  const transactions = txHook.data;
  const { toast, toastUndo } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const form = useForm<WalletInput>({
    resolver: zodResolver(walletSchema) as any,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { name: "", type: "CASH" as any, color: "#1a1a1a", icon: "wallet", initialBalance: 0 },
  });

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
  const total = useMemo(() => balances.reduce((a, b) => a + b.balance, 0), [balances]);

  function openCreate() {
    setEditing(null);
    form.reset({ name: "", type: "CASH" as any, color: "#1a1a1a", icon: "wallet", initialBalance: 0 });
    setOpen(true);
  }
  function openEdit(id: string) {
    const w = wallets.find((x) => x.id === id);
    if (!w) return;
    setEditing(id);
    form.reset({ name: w.name, type: w.type as any, color: w.color, icon: w.icon, initialBalance: w.initialBalance });
    setOpen(true);
  }
  async function handleSubmit(data: WalletInput) {
    const wasEditing = !!editing;
    try {
      if (editing) {
        await walletsHook.update(editing, { name: data.name, type: data.type as any, color: data.color, icon: data.icon, initialBalance: Number(data.initialBalance) });
      } else {
        await walletsHook.create({ name: data.name, type: data.type as any, color: data.color, icon: data.icon, initialBalance: Number(data.initialBalance) });
      }
      setOpen(false);
      toast(wasEditing ? "Dompet diperbarui" : "Dompet ditambah");
    } catch (e: any) {
      toast(e?.message || "Gagal menyimpan dompet");
    }
  }
  function requestDelete(id: string) {
    // jangan block di client pakai state lokal yang bisa stale / kefilter
    // backend yang jadi source of truth: kalau masih ada transaksi AKTIF (deletedAt=null) → 409 + pesan jumlah
    // kalau cuma sisa sampah soft-delete (deletedAt != null) → backend auto-purge lalu hapus wallet
    setConfirmId(id);
  }
  async function confirmDelete() {
    const id = confirmId;
    if (!id) return;
    const removed = wallets.find((w) => w.id === id);
    if (!removed) return;
    const idx = wallets.findIndex((w) => w.id === id);
    setConfirmId(null);
    try {
      await walletsHook.remove(id);
      toastUndo("Dompet dihapus", async () => {
        try {
          if (walletsHook.isDemo) {
            walletsHook.setData((prev: any) => {
              const next = [...prev];
              next.splice(idx, 0, removed as any);
              return next;
            });
          } else {
            await walletsHook.create({ name: removed.name, type: removed.type as any, color: removed.color, icon: removed.icon, initialBalance: removed.initialBalance });
          }
        } catch {}
      }, 10000);
    } catch (e: any) {
      toast(e?.message || "Gagal menghapus — mungkin masih dipakai di server");
    }
  }

  const isLoading = !walletsHook.hydrated || walletsHook.loading;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-[500] tracking-tight text-ink dark:text-[#e9e6e2]">Dompet</h1>
          <p className="text-[13px] text-mute dark:text-[#a7a39d] mt-0.5">Multi-dompet · saldo dipisah · transfer tidak merusak laporan</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" strokeWidth={1.75} /> Tambah</Button>
      </div>

      <Card className="rounded-[18px]">
        <CardContent className="p-6">
          <div className="text-[11px] font-medium tracking-widest text-mute dark:text-[#8f8b85] uppercase">Total Saldo Semua Dompet</div>
          <div className="mt-1 text-[28px] font-semibold tracking-tight leading-none num text-ink dark:text-[#e9e6e2]">{isLoading ? "—" : formatRupiah(total)}</div>
          <div className="text-[13px] text-mute dark:text-[#a7a39d] mt-2 num">{wallets.length} dompet · Cash + Bank + eWallet + Investasi</div>
          {walletsHook.error && <div className="mt-2 text-[12px] text-[#b42318] dark:text-[#fca5a5]">{walletsHook.error}</div>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {balances.map(({ wallet, balance }) => (
          <div key={wallet.id} className="relative">
            <WalletCard wallet={wallet as any} balance={balance} negative={balance < 0} />
            <div className="absolute top-2 right-2 flex gap-1">
              <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-white dark:bg-[#1d1d1d] border hairline" onClick={() => openEdit(wallet.id)} aria-label="Edit dompet"><Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /></Button>
              <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-white dark:bg-[#1d1d1d] border hairline" onClick={() => requestDelete(wallet.id)} aria-label="Hapus dompet"><Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /></Button>
            </div>
            <div className="text-[11px] text-mute dark:text-[#8f8b85] mt-2 px-1 num">awal {formatRupiah(wallet.initialBalance)} · {TYPE_LABEL[wallet.type] || wallet.type}</div>
          </div>
        ))}
      </div>

      {wallets.length === 0 && !isLoading && (
        <Card className="border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d]"><CardContent className="p-10 text-center"><div className="mx-auto h-10 w-10 rounded-xl bg-white dark:bg-[#141414] grid place-items-center text-mute dark:text-[#8f8b85] border hairline"><Wallet className="h-5 w-5" strokeWidth={1.75} /></div><div className="kicker mt-3">Kosong</div><div className="text-[13px] font-medium text-mute dark:text-[#a7a39d] mt-2">Belum ada dompet</div><div className="text-[12px] text-mute dark:text-[#8f8b85] mt-1">Tambah minimal 1 untuk mulai — Cash, BCA, GoPay, dll.</div><Button size="sm" className="mt-4" onClick={openCreate}><Plus className="h-4 w-4" strokeWidth={1.75} /> Tambah dompet</Button></CardContent></Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-[420px] p-0 overflow-hidden border-0 sm:border hairline flex flex-col max-h-[85dvh] sm:max-h-[90vh] rounded-t-[20px] sm:rounded-[18px]">
          <div className="shrink-0 px-6 pt-6 pb-3">
            <DialogHeader className="mb-0"><DialogTitle>{editing ? "Edit Dompet" : "Tambah Dompet"}</DialogTitle><p className="text-[12px] text-mute dark:text-[#8f8b85]">{editing ? "Ubah nama/tipe/saldo awal." : "Bikin dompet baru — saldo awal bisa 0."}</p></DialogHeader>
          </div>
          <form onSubmit={form.handleSubmit(handleSubmit as any)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-auto overscroll-contain px-6 space-y-4 pb-4">
              <div className="space-y-1.5">
                <Label>Nama Dompet</Label>
                <Input placeholder="BCA, Cash, GoPay..." {...form.register("name")} className="h-11" autoFocus />
                {form.formState.errors.name && <p className="text-xs text-ink dark:text-[#e9e6e2] font-medium">{form.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tipe</Label>
                  <Select value={form.watch("type")} onChange={(e) => form.setValue("type", e.target.value as any)} className="h-11">
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK">Bank</SelectItem>
                    <SelectItem value="E_WALLET">eWallet</SelectItem>
                    <SelectItem value="INVESTMENT">Investasi</SelectItem>
                    <SelectItem value="OTHER">Lainnya</SelectItem>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Warna</Label>
                  <Input type="color" className="h-11 p-1" {...form.register("color")} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Icon</Label>
                  <Select value={form.watch("icon")} onChange={(e) => form.setValue("icon", e.target.value)} className="h-11">
                    <SelectItem value="wallet">wallet</SelectItem>
                    <SelectItem value="landmark">landmark</SelectItem>
                    <SelectItem value="smartphone">smartphone</SelectItem>
                    <SelectItem value="trending-up">trending-up</SelectItem>
                    <SelectItem value="package">package</SelectItem>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Saldo Awal — Rp</Label>
                  <RupiahInput
                    value={typeof form.watch("initialBalance") === "number" ? (form.watch("initialBalance") as number) : undefined}
                    onValueChange={(v) => { form.setValue("initialBalance", (v ?? 0) as any, { shouldValidate: form.formState.isSubmitted }); if (form.formState.isSubmitted) form.trigger("initialBalance"); }}
                    className="h-11 text-[13px] font-semibold num"
                    inputMode="numeric"
                    placeholder="0"
                    aria-invalid={!!(form.formState.isSubmitted && form.formState.errors.initialBalance)}
                  />
                  {form.formState.isSubmitted && form.formState.errors.initialBalance && <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">{form.formState.errors.initialBalance.message as string}</p>}
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

      <Dialog open={!!confirmId} onOpenChange={(o) => { if (!o) setConfirmId(null); }}>
        <DialogContent onClose={() => setConfirmId(null)} className="max-w-[380px]">
          <DialogHeader><DialogTitle>Hapus dompet?</DialogTitle><p className="text-[13px] leading-relaxed text-mute dark:text-[#a7a39d]">Yakin hapus <span className="font-semibold text-ink dark:text-[#e9e6e2]">{wallets.find((w) => w.id === confirmId)?.name}</span>? Bisa diurungkan 10 detik.</p></DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 h-11" onClick={() => setConfirmId(null)}>Batal</Button>
            <Button className="flex-1 h-11 bg-[#b42318] hover:bg-[#991b1b] text-white dark:bg-[#fca5a5] dark:text-[#141414] dark:hover:bg-[#f87171]" onClick={confirmDelete}>Hapus</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
