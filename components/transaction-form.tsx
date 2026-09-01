"use client";
import { useMemo, useEffect } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema, type TransactionInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RupiahInput } from "@/components/ui/rupiah-input";
import { DateInput } from "@/components/ui/date-input";
import { formatRupiah, cn } from "@/lib/utils";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Plus } from "lucide-react";

type WalletOpt = { id: string; name: string };
type CatOpt = { id: string; name: string; type: "INCOME" | "EXPENSE"; color: string };

export function TransactionForm({
  wallets,
  categories,
  defaultType = "EXPENSE",
  onSubmit,
  triggerLabel = "Tambah",
  fab = false,
}: {
  wallets: WalletOpt[];
  categories: CatOpt[];
  defaultType?: "INCOME" | "EXPENSE" | "TRANSFER";
  onSubmit: (data: TransactionInput) => void | Promise<void>;
  triggerLabel?: string;
  fab?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema) as any,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      type: defaultType as any,
      amount: undefined as any,
      walletId: wallets[0]?.id || "",
      toWalletId: "",
      categoryId: "",
      description: "",
      date: new Date() as any,
    },
  });

  const type = form.watch("type");
  const walletId = form.watch("walletId");
  const categoryId = form.watch("categoryId");
  const toWalletId = form.watch("toWalletId");
  const amount = form.watch("amount");
  const filteredCats = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);
  const recentChips = useMemo(() => filteredCats.slice(0, 4), [filteredCats]);

  const canSubmit = useMemo(() => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return false;
    if (!walletId) return false;
    if (type === "TRANSFER") return !!toWalletId && toWalletId !== walletId;
    return !!categoryId;
  }, [amount, walletId, categoryId, toWalletId, type]);

  useEffect(() => {
    if (!form.getValues("walletId") && wallets[0]?.id) form.setValue("walletId", wallets[0].id);
  }, [wallets, form]);

  async function handleSubmit(data: TransactionInput) {
    await onSubmit(data);
    setOpen(false);
    form.reset({
      type: defaultType as any,
      amount: undefined as any,
      walletId: wallets[0]?.id || "",
      toWalletId: "",
      categoryId: "",
      description: "",
      date: new Date() as any,
    });
  }

  return (
    <>
      {fab ? (
        <button
          onClick={() => setOpen(true)}
          className="press fixed z-20 h-12 w-12 rounded-full bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] grid place-items-center hover:bg-[#2a2a2a] dark:hover:bg-white transition-[transform,colors] right-4 lg:right-6 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-6 border hairline"
          aria-label="Tambah transaksi"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </button>
      ) : (
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="h-3.5 w-3.5" strokeWidth={1.75} /> {triggerLabel}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Tambah transaksi</DialogTitle>
            <p className="text-[12px] text-mute dark:text-[#8f8b85]">Nominal → kategori → dompet → simpan. &lt; 10 detik.</p>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-4">
            <div className="inline-flex gap-1 rounded-full bg-[#f3f1ec] dark:bg-[#1d1d1d] p-1 border hairline">
              {[
                { v: "EXPENSE", label: "Keluar", icon: ArrowDownCircle },
                { v: "INCOME", label: "Masuk", icon: ArrowUpCircle },
                { v: "TRANSFER", label: "Transfer", icon: ArrowLeftRight },
              ].map((t) => (
                <button
                  type="button"
                  key={t.v}
                  onClick={() => {
                    form.setValue("type", t.v as any);
                    form.setValue("categoryId", "");
                    form.setValue("toWalletId", "");
                  }}
                  className={cn(
                    "press inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium tracking-tight transition-[transform,colors]",
                    type === t.v ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414]" : "text-mute dark:text-[#8f8b85] hover:text-ink dark:hover:text-[#e9e6e2]"
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {t.label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>Nominal — Rp</Label>
              <RupiahInput
                value={typeof amount === "number" ? amount : undefined}
                onValueChange={(v) => form.setValue("amount", v as any)}
                placeholder="0"
                autoFocus
                className="h-11 text-[16px] font-semibold tracking-tight num"
                aria-invalid={!!form.formState.errors.amount}
              />
              {typeof amount === "number" && amount > 0 && (
                <div className="text-[11px] text-mute dark:text-[#8f8b85] num">{formatRupiah(amount)}</div>
              )}
              {form.formState.errors.amount && <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">{form.formState.errors.amount.message as string}</p>}
            </div>

            {type !== "TRANSFER" && recentChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {recentChips.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      form.setValue("categoryId", c.id, { shouldValidate: form.formState.isSubmitted });
                      if (form.formState.isSubmitted) form.trigger("categoryId");
                    }}
                    className={cn(
                      "press rounded-full border hairline px-3 py-1 text-[11px] font-medium transition-colors",
                      categoryId === c.id ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] border-ink" : "bg-[#f3f1ec] dark:bg-[#1d1d1d] text-mute dark:text-[#a7a39d] hover:bg-white dark:hover:bg-[#222]"
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Dompet</Label>
                <Select value={form.watch("walletId")} onChange={(e) => { form.setValue("walletId", e.target.value, { shouldValidate: form.formState.isSubmitted }); if (form.formState.isSubmitted) form.trigger("walletId"); }}>
                  <option value="">Pilih dompet</option>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </Select>
                {form.formState.isSubmitted && form.formState.errors.walletId && <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">{form.formState.errors.walletId.message as string}</p>}
              </div>

              {type === "TRANSFER" ? (
                <div className="space-y-1.5">
                  <Label>Tujuan</Label>
                  <Select value={form.watch("toWalletId") || ""} onChange={(e) => { form.setValue("toWalletId", e.target.value, { shouldValidate: form.formState.isSubmitted }); if (form.formState.isSubmitted) form.trigger("toWalletId"); }}>
                    <option value="">Pilih tujuan</option>
                    {wallets.filter((w) => w.id !== form.watch("walletId")).map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </Select>
                  {form.formState.isSubmitted && form.formState.errors.toWalletId && <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">{(form.formState.errors.toWalletId as any).message}</p>}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Kategori</Label>
                  <Select value={form.watch("categoryId") || ""} onChange={(e) => { form.setValue("categoryId", e.target.value, { shouldValidate: form.formState.isSubmitted }); if (form.formState.isSubmitted) form.trigger("categoryId"); }}>
                    <option value="">Pilih kategori</option>
                    {filteredCats.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </Select>
                  {form.formState.isSubmitted && form.formState.errors.categoryId && <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">{(form.formState.errors.categoryId as any).message}</p>}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Catatan — opsional</Label>
              <Textarea placeholder="Ayam geprek, bensin, gaji..." {...form.register("description")} maxLength={100} />
            </div>

            <div className="space-y-1.5">
              <Label>Tanggal</Label>
              <DateInput
                value={form.watch("date") as any}
                onValueChange={(v) => form.setValue("date", v ? (new Date(`${v}T00:00:00`) as any) : (new Date() as any))}
                className="h-10"
              />
              <p className="text-[11px] text-mute dark:text-[#8f8b85]">WIB — default hari ini</p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="flex-1" disabled={!canSubmit}>Simpan</Button>
            </div>
            {!canSubmit && <p className="text-center text-[11px] text-mute dark:text-[#8f8b85]">Isi nominal + {type === "TRANSFER" ? "tujuan" : "kategori"} + dompet dulu</p>}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
