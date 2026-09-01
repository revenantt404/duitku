"use client";
import { useMemo, useEffect, useState } from "react";
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
          className="press fixed z-20 h-14 w-14 rounded-full bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] grid place-items-center hover:bg-[#2a2a2a] dark:hover:bg-white transition-[transform,colors] right-4 lg:right-6 bottom-[calc(88px+env(safe-area-inset-bottom))] lg:bottom-6 border hairline shadow-sm"
          aria-label="Tambah transaksi"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      ) : (
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="h-3.5 w-3.5" strokeWidth={1.75} /> {triggerLabel}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          onClose={() => setOpen(false)}
          className="max-w-[440px] p-0 overflow-hidden border-0 sm:border hairline flex flex-col max-h-[85dvh] sm:max-h-[90vh] rounded-t-[20px] sm:rounded-[18px]"
        >
          {/* header — fixed */}
          <div className="shrink-0 px-6 pt-6 pb-3">
            <DialogHeader className="mb-0">
              <DialogTitle>Tambah transaksi</DialogTitle>
              <p className="text-[12px] text-mute dark:text-[#8f8b85]">Nominal → kategori → dompet → simpan. &lt; 10 detik.</p>
            </DialogHeader>

            {/* type segmented */}
            <div className="inline-flex gap-1 rounded-full bg-[#f3f1ec] dark:bg-[#1d1d1d] p-1 border hairline mt-4">
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
                    type === t.v
                      ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414]"
                      : "text-mute dark:text-[#8f8b85] hover:text-ink dark:hover:text-[#e9e6e2]"
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {t.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit as any)} className="flex flex-col flex-1 min-h-0">
            {/* scrollable body — order: Nominal → Kategori → Dompet → Tanggal → Catatan */}
            <div className="flex-1 overflow-auto overscroll-contain px-6 space-y-4 pb-4">
              {/* 1. Nominal */}
              <div className="space-y-1.5">
                <Label>Nominal — Rp</Label>
                <RupiahInput
                  value={typeof amount === "number" ? amount : undefined}
                  onValueChange={(v) => form.setValue("amount", v as any)}
                  placeholder="0"
                  autoFocus
                  inputMode="numeric"
                  className="h-11 text-[16px] font-semibold tracking-tight num"
                  aria-invalid={!!form.formState.errors.amount}
                />
                {typeof amount === "number" && amount > 0 && (
                  <div className="text-[11px] text-mute dark:text-[#8f8b85] num">{formatRupiah(amount)}</div>
                )}
                {form.formState.errors.amount && (
                  <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">
                    {form.formState.errors.amount.message as string}
                  </p>
                )}
              </div>

              {/* 2. Kategori — pill grid 2 kolom (non-transfer) */}
              {type !== "TRANSFER" && (
                <div className="space-y-1.5">
                  <Label>Kategori</Label>
                  {filteredCats.length === 0 ? (
                    <p className="text-[12px] text-mute dark:text-[#8f8b85] border hairline rounded-[12px] px-3 py-3 bg-[#f3f1ec]/60 dark:bg-[#1d1d1d]">
                      Belum ada kategori {type === "INCOME" ? "pemasukan" : "pengeluaran"}. Tambah di menu Kategori dulu.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {filteredCats.map((c) => {
                        const active = categoryId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              form.setValue("categoryId", c.id, { shouldValidate: form.formState.isSubmitted });
                              if (form.formState.isSubmitted) form.trigger("categoryId");
                            }}
                            className={cn(
                              "press flex items-center gap-2 rounded-[12px] border hairline px-3 py-2.5 text-left transition-colors",
                              active
                                ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] border-ink dark:border-[#e9e6e2]"
                                : "bg-[#f3f1ec] dark:bg-[#1d1d1d] text-ink dark:text-[#e9e6e2] hover:bg-white dark:hover:bg-[#222]"
                            )}
                          >
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ background: active ? "#fff" : c.color }}
                              aria-hidden
                            />
                            <span className="text-[12.5px] font-medium leading-none truncate">{c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {form.formState.isSubmitted && (form.formState.errors.categoryId as any) && (
                    <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">
                      {(form.formState.errors.categoryId as any).message}
                    </p>
                  )}
                  {/* fallback select hidden — keep for screen reader / long list */}
                  <Select
                    value={form.watch("categoryId") || ""}
                    onChange={(e) => {
                      form.setValue("categoryId", e.target.value, { shouldValidate: form.formState.isSubmitted });
                      if (form.formState.isSubmitted) form.trigger("categoryId");
                    }}
                    className="sr-only"
                    aria-hidden
                    tabIndex={-1}
                  >
                    <option value="">Pilih kategori</option>
                    {filteredCats.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              )}

              {/* 3. Dompet — pill grid */}
              {type === "TRANSFER" ? (
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <Label>Dari dompet</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {wallets.map((w) => {
                        const active = walletId === w.id;
                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => {
                              form.setValue("walletId", w.id, { shouldValidate: form.formState.isSubmitted });
                              if (form.formState.isSubmitted) form.trigger("walletId");
                            }}
                            className={cn(
                              "press flex items-center gap-2 rounded-[12px] border hairline px-3 py-2.5 text-left transition-colors",
                              active
                                ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] border-ink"
                                : "bg-white dark:bg-[#1d1d1d] text-mute dark:text-[#a7a39d] hover:bg-[#f3f1ec] dark:hover:bg-[#222]"
                            )}
                          >
                            <span className="text-[12.5px] font-medium truncate">{w.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    {form.formState.isSubmitted && form.formState.errors.walletId && (
                      <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">
                        {form.formState.errors.walletId.message as string}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tujuan</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {wallets
                        .filter((w) => w.id !== walletId)
                        .map((w) => {
                          const active = toWalletId === w.id;
                          return (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => {
                                form.setValue("toWalletId", w.id, { shouldValidate: form.formState.isSubmitted });
                                if (form.formState.isSubmitted) form.trigger("toWalletId");
                              }}
                              className={cn(
                                "press flex items-center gap-2 rounded-[12px] border hairline px-3 py-2.5 text-left transition-colors",
                                active
                                  ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] border-ink"
                                  : "bg-white dark:bg-[#1d1d1d] text-mute dark:text-[#a7a39d] hover:bg-[#f3f1ec] dark:hover:bg-[#222]"
                              )}
                            >
                              <span className="text-[12.5px] font-medium truncate">{w.name}</span>
                            </button>
                          );
                        })}
                    </div>
                    {wallets.filter((w) => w.id !== walletId).length === 0 && (
                      <p className="text-[11px] text-mute">Butuh minimal 2 dompet untuk transfer.</p>
                    )}
                    {form.formState.isSubmitted && (form.formState.errors.toWalletId as any) && (
                      <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">
                        {(form.formState.errors.toWalletId as any).message}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Dompet</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {wallets.map((w) => {
                      const active = walletId === w.id;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => {
                            form.setValue("walletId", w.id, { shouldValidate: form.formState.isSubmitted });
                            if (form.formState.isSubmitted) form.trigger("walletId");
                          }}
                          className={cn(
                            "press flex items-center gap-2 rounded-[12px] border hairline px-3 py-2.5 text-left transition-colors",
                            active
                              ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] border-ink"
                              : "bg-white dark:bg-[#1d1d1d] text-mute dark:text-[#a7a39d] hover:bg-[#f3f1ec] dark:hover:bg-[#222]"
                          )}
                        >
                          <span className="text-[12.5px] font-medium truncate">{w.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {wallets.length === 0 && <p className="text-[11px] text-mute">Belum ada dompet. Tambah di menu Dompet.</p>}
                  {form.formState.isSubmitted && form.formState.errors.walletId && (
                    <p className="text-[11px] font-medium text-[#b42318] dark:text-[#fca5a5]">
                      {form.formState.errors.walletId.message as string}
                    </p>
                  )}
                  {/* hidden select for validation parity */}
                  <Select
                    value={form.watch("walletId")}
                    onChange={(e) => {
                      form.setValue("walletId", e.target.value, { shouldValidate: form.formState.isSubmitted });
                      if (form.formState.isSubmitted) form.trigger("walletId");
                    }}
                    className="sr-only"
                    aria-hidden
                    tabIndex={-1}
                  >
                    <option value="">Pilih dompet</option>
                    {wallets.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              )}

              {/* 4. Tanggal */}
              <div className="space-y-1.5">
                <Label>Tanggal</Label>
                <DateInput
                  value={form.watch("date") as any}
                  onValueChange={(v) => form.setValue("date", v ? (new Date(`${v}T00:00:00`) as any) : (new Date() as any))}
                  className="h-11"
                />
                <p className="text-[11px] text-mute dark:text-[#8f8b85]">WIB — default hari ini</p>
              </div>

              {/* 5. Catatan */}
              <div className="space-y-1.5">
                <Label>Catatan — opsional</Label>
                <Textarea placeholder="Ayam geprek, bensin, gaji..." {...form.register("description")} maxLength={100} />
              </div>
            </div>

            {/* sticky footer — Simpan */}
            <div className="shrink-0 sticky bottom-0 bg-white dark:bg-[#1d1d1d] border-t hairline px-6 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] mt-2">
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="flex-1 h-11" disabled={!canSubmit}>
                  Simpan
                </Button>
              </div>
              {!canSubmit && (
                <p className="text-center text-[11px] text-mute dark:text-[#8f8b85] mt-2">
                  Isi nominal + {type === "TRANSFER" ? "tujuan" : "kategori"} + dompet dulu
                </p>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
