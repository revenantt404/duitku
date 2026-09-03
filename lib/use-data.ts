"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DEMO_WALLETS, DEMO_CATEGORIES, DEMO_BUDGETS, DEMO_GOALS, DEMO_VERSION, seedDemoTx } from "./demo-data";
import type { DemoWallet, DemoCategory, DemoTx, DemoBudget, DemoGoal } from "./demo-data";
import {
  listWallets, createWallet as apiCreateWallet, updateWallet as apiUpdateWallet, deleteWallet as apiDeleteWallet,
  listCategories, createCategory as apiCreateCategory, updateCategory as apiUpdateCategory, deleteCategory as apiDeleteCategory,
  listTransactions, createTransaction as apiCreateTx, deleteTransaction as apiDeleteTx,
  listBudgets, createBudget as apiCreateBudget, updateBudget as apiUpdateBudget, deleteBudget as apiDeleteBudget,
  listGoals, createGoal as apiCreateGoal, updateGoal as apiUpdateGoal, deleteGoal as apiDeleteGoal,
  type ApiWallet, type ApiCategory, type ApiTx, type ApiBudget, type ApiGoal,
} from "./api";

// ─ helper demo-mimic yang sinkron dengan localStorage
function useLocalArray<T>(key: string, initial: T[]) {
  const [data, setData] = useState<T[]>(initial);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const ver = localStorage.getItem("duitku_demo_version");
      if (ver !== DEMO_VERSION) {
        ["duitku_demo_wallets","duitku_demo_categories","duitku_demo_transactions","duitku_demo_budgets","duitku_demo_goals"].forEach((k) => localStorage.removeItem(k));
        localStorage.setItem("duitku_demo_version", DEMO_VERSION);
        localStorage.setItem(key, JSON.stringify(initial));
        setData(initial);
      } else {
        const raw = localStorage.getItem(key);
        if (raw) setData(JSON.parse(raw));
        else localStorage.setItem(key, JSON.stringify(initial));
      }
    } catch {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
  }, [key, data, hydrated]);
  return [data, setData, hydrated] as const;
}

function useIsDemo(): boolean | null {
  const [isDemo, setIsDemo] = useState<boolean | null>(null);
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const placeholder = !url || !key || url.includes("placeholder") || key === "placeholder" || url.includes("localhost");
    let demo = placeholder;
    try {
      if (localStorage.getItem("duitku_demo_user")) demo = true;
    } catch {}
    setIsDemo(demo);
  }, []);
  return isDemo;
}

// ─ normalisasi demo ↔ api ke tipe bersama (number semua)
export type UWallet = DemoWallet;
export type UCategory = DemoCategory;
export type UTx = DemoTx;
export type UBudget = DemoBudget;
export type UGoal = DemoGoal;

function mapApiWallet(w: ApiWallet): UWallet {
  return { id: w.id, name: w.name, type: w.type as any, color: w.color, icon: w.icon, initialBalance: w.initialBalance };
}
function mapApiCategory(c: ApiCategory): UCategory {
  return { id: c.id, name: c.name, icon: c.icon, color: c.color, type: c.type as any, isSystem: c.isSystem };
}
function mapApiTx(t: ApiTx): UTx {
  return {
    id: t.id,
    walletId: t.walletId,
    toWalletId: t.toWalletId,
    categoryId: t.categoryId,
    type: t.type as any,
    amount: t.amount,
    description: t.description,
    date: t.date,
    transferId: t.transferId,
  };
}
function mapApiBudget(b: ApiBudget): UBudget {
  return { id: b.id, categoryId: b.categoryId, amount: b.amount, month: b.month, year: b.year };
}
function mapApiGoal(g: ApiGoal): UGoal {
  return { id: g.id, name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount, deadline: g.deadline, icon: g.icon, color: g.color };
}

// ─ Hooks utama: TanStack Query + demo fallback ─
export function useWallets() {
  const isDemo = useIsDemo();
  const demo = useLocalArray<DemoWallet>("duitku_demo_wallets", DEMO_WALLETS);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const rows = await listWallets();
      return rows.map(mapApiWallet);
    },
    enabled: isDemo === false,
  });

  const data: UWallet[] = isDemo ? demo[0] : (query.data ?? []);
  const hydrated: boolean = isDemo === null ? false : isDemo ? demo[2] : !query.isPending;
  const loading = isDemo === null ? true : isDemo ? false : query.isPending;
  const isFetching: boolean = isDemo ? false : query.isFetching;
  const error: string | null = isDemo ? null : query.error ? (query.error as any)?.message || "Gagal memuat dompet" : null;
  const refresh = useCallback(() => query.refetch(), [query]);

  const setData = isDemo
    ? demo[1]
    : ((updater: any) => {
        qc.setQueryData<UWallet[]>(["wallets"], (prev) => {
          const curr = prev ?? [];
          const next = typeof updater === "function" ? (updater as any)(curr) : updater;
          return next;
        });
      });

  const create = useCallback(async (input: { name: string; type: UWallet["type"]; color: string; icon: string; initialBalance: number }) => {
    if (isDemo) {
      const row: UWallet = { id: `w_${Date.now()}`, ...input };
      demo[1]((prev) => [...prev, row]);
      return row;
    }
    // optimistic: insert temp row
    const temp: UWallet = { id: `w_temp_${Date.now()}`, ...input } as UWallet;
    const prev = qc.getQueryData<UWallet[]>(["wallets"]);
    qc.setQueryData<UWallet[]>(["wallets"], (old) => [...(old ?? []), temp]);
    try {
      const w = await apiCreateWallet(input as any);
      const mapped = mapApiWallet(w);
      qc.setQueryData<UWallet[]>(["wallets"], (old) => (old ?? []).map((x) => x.id === temp.id ? mapped : x));
      // invalidate related
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      return mapped;
    } catch (e) {
      qc.setQueryData(["wallets"], prev);
      throw e;
    }
  }, [isDemo, demo, qc]);

  const update = useCallback(async (id: string, patch: Partial<{ name: string; type: UWallet["type"]; color: string; icon: string; initialBalance: number }>) => {
    if (isDemo) {
      demo[1]((prev) => prev.map((w) => w.id === id ? { ...w, ...patch } as UWallet : w));
      return;
    }
    const prev = qc.getQueryData<UWallet[]>(["wallets"]);
    qc.setQueryData<UWallet[]>(["wallets"], (old) => (old ?? []).map((w) => w.id === id ? { ...w, ...patch } as UWallet : w));
    try {
      const w = await apiUpdateWallet(id, patch as any);
      const mapped = mapApiWallet(w);
      qc.setQueryData<UWallet[]>(["wallets"], (old) => (old ?? []).map((x) => x.id === id ? mapped : x));
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      return mapped;
    } catch (e) {
      qc.setQueryData(["wallets"], prev);
      throw e;
    }
  }, [isDemo, demo, qc]);

  const remove = useCallback(async (id: string) => {
    if (isDemo) {
      demo[1]((prev) => prev.filter((w) => w.id !== id));
      return;
    }
    const prev = qc.getQueryData<UWallet[]>(["wallets"]);
    qc.setQueryData<UWallet[]>(["wallets"], (old) => (old ?? []).filter((w) => w.id !== id));
    try {
      await apiDeleteWallet(id);
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    } catch (e) {
      qc.setQueryData(["wallets"], prev);
      throw e;
    }
  }, [isDemo, demo, qc]);

  return { data, setData, hydrated, loading, isFetching, error, isDemo: isDemo === true, refresh, create, update, remove } as const;
}

export function useCategories() {
  const isDemo = useIsDemo();
  const demo = useLocalArray<DemoCategory>("duitku_demo_categories", DEMO_CATEGORIES);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const rows = await listCategories();
      return rows.map(mapApiCategory);
    },
    enabled: isDemo === false,
  });

  const data: UCategory[] = isDemo ? demo[0] : (query.data ?? []);
  const hydrated: boolean = isDemo === null ? false : isDemo ? demo[2] : !query.isPending;
  const loading = isDemo === null ? true : isDemo ? false : query.isPending;
  const isFetching: boolean = isDemo ? false : query.isFetching;
  const error: string | null = isDemo ? null : query.error ? (query.error as any)?.message || "Gagal memuat kategori" : null;
  const refresh = useCallback(() => query.refetch(), [query]);

  const setData = isDemo
    ? demo[1]
    : ((updater: any) => {
        qc.setQueryData<UCategory[]>(["categories"], (prev) => {
          const curr = prev ?? [];
          const next = typeof updater === "function" ? (updater as any)(curr) : updater;
          return next;
        });
      });

  const create = useCallback(async (input: { name: string; icon: string; color: string; type: "INCOME" | "EXPENSE" }) => {
    if (isDemo) {
      const row: UCategory = { id: `c_${Date.now()}`, ...input, isSystem: false };
      demo[1]((prev) => [...prev, row]);
      return row;
    }
    const c = await apiCreateCategory(input as any);
    const mapped = mapApiCategory(c);
    qc.setQueryData<UCategory[]>(["categories"], (old) => [...(old ?? []), mapped]);
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["budgets"] });
    return mapped;
  }, [isDemo, demo, qc]);

  const remove = useCallback(async (id: string) => {
    if (isDemo) { demo[1]((prev) => prev.filter((c) => c.id !== id)); return; }
    await apiDeleteCategory(id);
    qc.setQueryData<UCategory[]>(["categories"], (old) => (old ?? []).filter((c) => c.id !== id));
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["budgets"] });
  }, [isDemo, demo, qc]);

  const update = useCallback(async (id: string, patch: Partial<{ name: string; icon: string; color: string; type: "INCOME" | "EXPENSE" }>) => {
    if (isDemo) {
      demo[1]((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } as UCategory : c));
      return;
    }
    const c = await apiUpdateCategory(id, patch as any);
    const mapped = mapApiCategory(c);
    qc.setQueryData<UCategory[]>(["categories"], (old) => (old ?? []).map((x) => x.id === id ? mapped : x));
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["budgets"] });
    return mapped;
  }, [isDemo, demo, qc]);

  return { data, setData, hydrated, loading, isFetching, error, isDemo: isDemo === true, refresh, create, update, remove } as const;
}

export function useTransactions() {
  const isDemo = useIsDemo();
  const seeded = useMemo(() => seedDemoTx(), []);
  const demo = useLocalArray<DemoTx>("duitku_demo_transactions", seeded);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const rows = await listTransactions();
      return rows.map(mapApiTx);
    },
    enabled: isDemo === false,
  });

  const data: UTx[] = isDemo ? demo[0] : (query.data ?? []);
  const hydrated: boolean = isDemo === null ? false : isDemo ? demo[2] : !query.isPending;
  const loading = isDemo === null ? true : isDemo ? false : query.isPending;
  const isFetching: boolean = isDemo ? false : query.isFetching;
  const error: string | null = isDemo ? null : query.error ? (query.error as any)?.message || "Gagal memuat transaksi" : null;
  const refresh = useCallback(() => query.refetch(), [query]);

  const setData = isDemo
    ? demo[1]
    : ((updater: any) => {
        qc.setQueryData<UTx[]>(["transactions"], (prev) => {
          const curr = prev ?? [];
          const next = typeof updater === "function" ? (updater as any)(curr) : updater;
          return next;
        });
      });

  const create = useCallback(async (input: { walletId: string; toWalletId?: string | null; categoryId?: string | null; type: "INCOME" | "EXPENSE" | "TRANSFER"; amount: number; description?: string | null; date: string | Date }) => {
    if (isDemo) {
      const row: UTx = {
        id: `t_${Date.now()}`,
        walletId: input.walletId,
        toWalletId: input.toWalletId || null,
        categoryId: input.categoryId || null,
        type: input.type as any,
        amount: Number(input.amount),
        description: input.description || null,
        date: (input.date instanceof Date ? input.date.toISOString() : new Date(input.date as any).toISOString()),
        transferId: input.type === "TRANSFER" ? `tr_${Date.now()}` : null,
      };
      demo[1]((prev) => [row, ...prev]);
      return row;
    }
    // optimistic: prepend temp tx
    const temp: UTx = {
      id: `t_temp_${Date.now()}`,
      walletId: input.walletId,
      toWalletId: input.toWalletId || null,
      categoryId: input.categoryId || null,
      type: input.type as any,
      amount: Number(input.amount),
      description: input.description || null,
      date: (input.date instanceof Date ? (input.date as Date).toISOString() : new Date(input.date as any).toISOString()),
      transferId: input.type === "TRANSFER" ? `tr_temp_${Date.now()}` : null,
    };
    const prev = qc.getQueryData<UTx[]>(["transactions"]);
    qc.setQueryData<UTx[]>(["transactions"], (old) => [temp, ...(old ?? [])]);
    try {
      const t = await apiCreateTx({
        walletId: input.walletId,
        toWalletId: input.toWalletId || null,
        categoryId: input.categoryId || null,
        type: input.type as any,
        amount: input.amount,
        description: input.description || null,
        date: input.date instanceof Date ? input.date.toISOString() : (input.date as string),
      } as any);
      const mapped = mapApiTx(t);
      qc.setQueryData<UTx[]>(["transactions"], (old) => (old ?? []).map((x) => x.id === temp.id ? mapped : x));
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      return mapped;
    } catch (e) {
      qc.setQueryData(["transactions"], prev);
      throw e;
    }
  }, [isDemo, demo, qc]);

  const remove = useCallback(async (id: string) => {
    if (isDemo) { demo[1]((prev) => prev.filter((t) => t.id !== id)); return; }
    const prev = qc.getQueryData<UTx[]>(["transactions"]);
    qc.setQueryData<UTx[]>(["transactions"], (old) => (old ?? []).filter((t) => t.id !== id));
    try {
      await apiDeleteTx(id);
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
    } catch (e) {
      qc.setQueryData(["transactions"], prev);
      throw e;
    }
  }, [isDemo, demo, qc]);

  // update transaksi (Supabase: soft-delete lalu create baru)
  const update = useCallback(async (id: string, patch: Partial<{ walletId: string; toWalletId: string | null; categoryId: string | null; type: UTx["type"]; amount: number; description: string | null; date: string | Date }>) => {
    if (isDemo) {
      demo[1]((prev) => prev.map((t) => t.id === id ? {
        ...t,
        walletId: patch.walletId ?? t.walletId,
        toWalletId: patch.toWalletId !== undefined ? patch.toWalletId : t.toWalletId,
        categoryId: patch.categoryId !== undefined ? patch.categoryId : t.categoryId,
        type: (patch.type as any) ?? t.type,
        amount: patch.amount !== undefined ? Number(patch.amount) : t.amount,
        description: patch.description !== undefined ? patch.description : t.description,
        date: patch.date ? (patch.date instanceof Date ? patch.date.toISOString() : new Date(patch.date as any).toISOString()) : t.date,
      } : t));
      return;
    }
    const existing = (qc.getQueryData<UTx[]>(["transactions"]) ?? []).find((t) => t.id === id);
    if (!existing) throw new Error("Transaksi tidak ditemukan");
    const nextData = {
      walletId: patch.walletId ?? existing.walletId,
      toWalletId: patch.toWalletId !== undefined ? patch.toWalletId : existing.toWalletId,
      categoryId: patch.categoryId !== undefined ? patch.categoryId : existing.categoryId,
      type: (patch.type as any) ?? existing.type,
      amount: patch.amount !== undefined ? Number(patch.amount) : existing.amount,
      description: patch.description !== undefined ? patch.description : existing.description,
      date: patch.date ? (patch.date instanceof Date ? patch.date.toISOString() : new Date(patch.date as any).toISOString()) : existing.date,
    };
    // optimistic: replace in cache
    const prev = qc.getQueryData<UTx[]>(["transactions"]);
    qc.setQueryData<UTx[]>(["transactions"], (old) => (old ?? []).map((t) => t.id === id ? { ...t, ...nextData, id } as UTx : t));
    try {
      await apiDeleteTx(id);
      const created = await apiCreateTx(nextData as any);
      const mapped = mapApiTx(created);
      qc.setQueryData<UTx[]>(["transactions"], (old) => {
        const withoutOld = (old ?? []).filter((t) => t.id !== id);
        return [mapped, ...withoutOld];
      });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      return mapped;
    } catch (e) {
      qc.setQueryData(["transactions"], prev);
      throw e;
    }
  }, [isDemo, demo, qc]);

  const duplicate = useCallback(async (id: string) => {
    const src = (isDemo ? demo[0] : (qc.getQueryData<UTx[]>(["transactions"]) ?? [])).find((t) => t.id === id);
    if (!src) throw new Error("Transaksi tidak ditemukan");
    return await create({
      walletId: src.walletId,
      toWalletId: src.toWalletId,
      categoryId: src.categoryId,
      type: src.type as any,
      amount: src.amount,
      description: src.description,
      date: new Date().toISOString() as any,
    });
  }, [isDemo, demo, qc, create]);

  return { data, setData, hydrated, loading, isFetching, error, isDemo: isDemo === true, refresh, create, update, remove, duplicate } as const;
}

export function useBudgets() {
  const isDemo = useIsDemo();
  const demo = useLocalArray<DemoBudget>("duitku_demo_budgets", DEMO_BUDGETS);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const rows = await listBudgets();
      return rows.map(mapApiBudget);
    },
    enabled: isDemo === false,
  });

  const data: UBudget[] = isDemo ? demo[0] : (query.data ?? []);
  const hydrated: boolean = isDemo === null ? false : isDemo ? demo[2] : !query.isPending;
  const loading = isDemo === null ? true : isDemo ? false : query.isPending;
  const isFetching: boolean = isDemo ? false : query.isFetching;
  const error: string | null = isDemo ? null : query.error ? (query.error as any)?.message || "Gagal memuat anggaran" : null;
  const refresh = useCallback(() => query.refetch(), [query]);

  const setData = isDemo
    ? demo[1]
    : ((updater: any) => {
        qc.setQueryData<UBudget[]>(["budgets"], (prev) => {
          const curr = prev ?? [];
          const next = typeof updater === "function" ? (updater as any)(curr) : updater;
          return next;
        });
      });

  const create = useCallback(async (input: { categoryId: string; amount: number; month: number; year: number }) => {
    if (isDemo) {
      const exists = demo[0].some((b) => b.categoryId === input.categoryId && b.month === input.month && b.year === input.year);
      if (exists) throw new Error("Anggaran kategori ini di bulan ini sudah ada");
      const row: UBudget = { id: `b_${Date.now()}`, ...input };
      demo[1]((prev) => [...prev, row]);
      return row;
    }
    const b = await apiCreateBudget(input as any);
    const mapped = mapApiBudget(b);
    qc.setQueryData<UBudget[]>(["budgets"], (old) => [...(old ?? []), mapped]);
    qc.invalidateQueries({ queryKey: ["budgets"] });
    return mapped;
  }, [isDemo, demo, qc]);

  const update = useCallback(async (id: string, patch: Partial<{ categoryId: string; amount: number; month: number; year: number }>) => {
    if (isDemo) {
      demo[1]((prev) => prev.map((b) => b.id === id ? { ...b, ...patch } as UBudget : b));
      return;
    }
    if (patch.amount !== undefined && patch.categoryId === undefined && patch.month === undefined && patch.year === undefined) {
      const b = await apiUpdateBudget(id, patch.amount as any);
      const mapped = mapApiBudget(b);
      qc.setQueryData<UBudget[]>(["budgets"], (old) => (old ?? []).map((x) => x.id === id ? mapped : x));
      qc.invalidateQueries({ queryKey: ["budgets"] });
      return mapped;
    }
    const existing = (qc.getQueryData<UBudget[]>(["budgets"]) ?? []).find((b) => b.id === id);
    if (!existing) throw new Error("Budget tidak ditemukan");
    const next = { categoryId: patch.categoryId ?? existing.categoryId, amount: patch.amount ?? existing.amount, month: patch.month ?? existing.month, year: patch.year ?? existing.year };
    await apiDeleteBudget(id);
    const created = await apiCreateBudget(next as any);
    const mapped = mapApiBudget(created);
    qc.setQueryData<UBudget[]>(["budgets"], (old) => [...(old ?? []).filter((b) => b.id !== id), mapped]);
    qc.invalidateQueries({ queryKey: ["budgets"] });
    return mapped;
  }, [isDemo, demo, qc]);

  const remove = useCallback(async (id: string) => {
    if (isDemo) { demo[1]((prev) => prev.filter((b) => b.id !== id)); return; }
    await apiDeleteBudget(id);
    qc.setQueryData<UBudget[]>(["budgets"], (old) => (old ?? []).filter((b) => b.id !== id));
    qc.invalidateQueries({ queryKey: ["budgets"] });
  }, [isDemo, demo, qc]);

  return { data, setData, hydrated, loading, isFetching, error, isDemo: isDemo === true, refresh, create, update, remove } as const;
}

export function useGoals() {
  const isDemo = useIsDemo();
  const demo = useLocalArray<DemoGoal>("duitku_demo_goals", DEMO_GOALS);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const rows = await listGoals();
      return rows.map(mapApiGoal);
    },
    enabled: isDemo === false,
  });

  const data: UGoal[] = isDemo ? demo[0] : (query.data ?? []);
  const hydrated: boolean = isDemo === null ? false : isDemo ? demo[2] : !query.isPending;
  const loading = isDemo === null ? true : isDemo ? false : query.isPending;
  const isFetching: boolean = isDemo ? false : query.isFetching;
  const error: string | null = isDemo ? null : query.error ? (query.error as any)?.message || "Gagal memuat tujuan" : null;
  const refresh = useCallback(() => query.refetch(), [query]);

  const setData = isDemo
    ? demo[1]
    : ((updater: any) => {
        qc.setQueryData<UGoal[]>(["goals"], (prev) => {
          const curr = prev ?? [];
          const next = typeof updater === "function" ? (updater as any)(curr) : updater;
          return next;
        });
      });

  const create = useCallback(async (input: { name: string; targetAmount: number; currentAmount?: number; deadline?: string | null; icon?: string; color?: string }) => {
    if (isDemo) {
      const row: UGoal = { id: `g_${Date.now()}`, name: input.name, targetAmount: input.targetAmount, currentAmount: input.currentAmount ?? 0, deadline: input.deadline ?? null, icon: input.icon ?? "target", color: input.color ?? "#1a1a1a" };
      demo[1]((prev) => [...prev, row]);
      return row;
    }
    const g = await apiCreateGoal({ name: input.name, targetAmount: input.targetAmount, currentAmount: input.currentAmount ?? 0, deadline: input.deadline ?? null, icon: input.icon ?? "target", color: input.color ?? "#1a1a1a" } as any);
    const mapped = mapApiGoal(g);
    qc.setQueryData<UGoal[]>(["goals"], (old) => [...(old ?? []), mapped]);
    qc.invalidateQueries({ queryKey: ["goals"] });
    return mapped;
  }, [isDemo, demo, qc]);

  const update = useCallback(async (id: string, patch: Partial<{ name: string; targetAmount: number; currentAmount: number; deadline: string | null; icon: string; color: string }>) => {
    if (isDemo) {
      demo[1]((prev) => prev.map((g) => g.id === id ? { ...g, ...patch } as UGoal : g));
      return;
    }
    const g = await apiUpdateGoal(id, patch as any);
    const mapped = mapApiGoal(g);
    qc.setQueryData<UGoal[]>(["goals"], (old) => (old ?? []).map((x) => x.id === id ? mapped : x));
    qc.invalidateQueries({ queryKey: ["goals"] });
    return mapped;
  }, [isDemo, demo, qc]);

  const remove = useCallback(async (id: string) => {
    if (isDemo) { demo[1]((prev) => prev.filter((g) => g.id !== id)); return; }
    await apiDeleteGoal(id);
    qc.setQueryData<UGoal[]>(["goals"], (old) => (old ?? []).filter((g) => g.id !== id));
    qc.invalidateQueries({ queryKey: ["goals"] });
  }, [isDemo, demo, qc]);

  const topup = useCallback(async (id: string, amount: number) => {
    if (isDemo) {
      demo[1]((prev) => prev.map((g) => g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g));
      return;
    }
    const existing = (qc.getQueryData<UGoal[]>(["goals"]) ?? []).find((g) => g.id === id);
    if (!existing) throw new Error("Tujuan tidak ditemukan");
    const g = await apiUpdateGoal(id, { currentAmount: existing.currentAmount + amount } as any);
    const mapped = mapApiGoal(g);
    qc.setQueryData<UGoal[]>(["goals"], (old) => (old ?? []).map((x) => x.id === id ? mapped : x));
    qc.invalidateQueries({ queryKey: ["goals"] });
    return mapped;
  }, [isDemo, demo, qc]);

  return { data, setData, hydrated, loading, isFetching, error, isDemo: isDemo === true, refresh, create, update, remove, topup } as const;
}
