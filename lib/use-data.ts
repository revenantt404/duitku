"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DEMO_WALLETS, DEMO_CATEGORIES, DEMO_BUDGETS, DEMO_GOALS, DEMO_VERSION, seedDemoTx } from "./demo-data";
import type { DemoWallet, DemoCategory, DemoTx, DemoBudget, DemoGoal } from "./demo-data";
import {
  listWallets, createWallet as apiCreateWallet, updateWallet as apiUpdateWallet, deleteWallet as apiDeleteWallet,
  listCategories, createCategory as apiCreateCategory, deleteCategory as apiDeleteCategory,
  listTransactions, createTransaction as apiCreateTx, deleteTransaction as apiDeleteTx,
  listBudgets, createBudget as apiCreateBudget, updateBudget as apiUpdateBudget, deleteBudget as apiDeleteBudget,
  listGoals, createGoal as apiCreateGoal, updateGoal as apiUpdateGoal, deleteGoal as apiDeleteGoal,
  type ApiWallet, type ApiCategory, type ApiTx, type ApiBudget, type ApiGoal,
} from "./api";

// ─ helper demo-mimic yang sinkron dengan localStorage (copy dari demo-store tapi dipakai lokal)
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
      // jika placeholder true, paksa demo; jika sudah login Supabase (ada session), jangan demo
      // cek supabase cookie tidak reliably di client — cukup placeholder check
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

// ─ Hooks utama: auto-switch demo ↔ Supabase ─

export function useWallets() {
  const isDemo = useIsDemo();
  const demo = useLocalArray<DemoWallet>("duitku_demo_wallets", DEMO_WALLETS);
  const [apiData, setApiData] = useState<UWallet[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (isDemo === null) return;
    if (isDemo) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const rows = await listWallets();
      setApiData(rows.map(mapApiWallet));
    } catch (e: any) {
      setError(e?.message || "Gagal memuat dompet");
    } finally { setLoading(false); }
  }, [isDemo]);

  useEffect(() => { refresh(); }, [refresh]);

  const data: UWallet[] = isDemo ? demo[0] : (apiData ?? []);
  const hydrated: boolean = isDemo ? demo[2] : !loading;
  const setData = isDemo ? demo[1] : (updater: any) => {
    // di mode Supabase, setData langsung hanya update optimistik lokal (tanpa API)
    setApiData((prev) => {
      const curr = prev ?? [];
      const next = typeof updater === "function" ? (updater as any)(curr) : updater;
      return next;
    });
  };

  const create = useCallback(async (input: { name: string; type: UWallet["type"]; color: string; icon: string; initialBalance: number }) => {
    if (isDemo) {
      const row: UWallet = { id: `w_${Date.now()}`, ...input };
      demo[1]((prev) => [...prev, row]);
      return row;
    }
    const w = await apiCreateWallet(input as any);
    const mapped = mapApiWallet(w);
    setApiData((prev) => [...(prev ?? []), mapped]);
    return mapped;
  }, [isDemo, demo]);

  const update = useCallback(async (id: string, patch: Partial<{ name: string; type: UWallet["type"]; color: string; icon: string; initialBalance: number }>) => {
    if (isDemo) {
      demo[1]((prev) => prev.map((w) => w.id === id ? { ...w, ...patch } as UWallet : w));
      return;
    }
    const w = await apiUpdateWallet(id, patch as any);
    const mapped = mapApiWallet(w);
    setApiData((prev) => (prev ?? []).map((x) => x.id === id ? mapped : x));
    return mapped;
  }, [isDemo, demo]);

  const remove = useCallback(async (id: string) => {
    if (isDemo) {
      demo[1]((prev) => prev.filter((w) => w.id !== id));
      return;
    }
    await apiDeleteWallet(id);
    setApiData((prev) => (prev ?? []).filter((w) => w.id !== id));
  }, [isDemo, demo]);

  return { data, setData, hydrated, loading, error, isDemo: isDemo === true, refresh, create, update, remove } as const;
}

export function useCategories() {
  const isDemo = useIsDemo();
  const demo = useLocalArray<DemoCategory>("duitku_demo_categories", DEMO_CATEGORIES);
  const [apiData, setApiData] = useState<UCategory[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (isDemo === null) return;
    if (isDemo) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const rows = await listCategories();
      setApiData(rows.map(mapApiCategory));
    } catch (e: any) { setError(e?.message || "Gagal memuat kategori"); }
    finally { setLoading(false); }
  }, [isDemo]);

  useEffect(() => { refresh(); }, [refresh]);

  const data: UCategory[] = isDemo ? demo[0] : (apiData ?? []);
  const hydrated: boolean = isDemo ? demo[2] : !loading;
  const setData = isDemo ? demo[1] : (updater: any) => {
    setApiData((prev) => {
      const curr = prev ?? [];
      const next = typeof updater === "function" ? (updater as any)(curr) : updater;
      return next;
    });
  };

  const create = useCallback(async (input: { name: string; icon: string; color: string; type: "INCOME" | "EXPENSE" }) => {
    if (isDemo) {
      const row: UCategory = { id: `c_${Date.now()}`, ...input, isSystem: false };
      demo[1]((prev) => [...prev, row]);
      return row;
    }
    const c = await apiCreateCategory(input as any);
    const mapped = mapApiCategory(c);
    setApiData((prev) => [...(prev ?? []), mapped]);
    return mapped;
  }, [isDemo, demo]);

  const remove = useCallback(async (id: string) => {
    if (isDemo) { demo[1]((prev) => prev.filter((c) => c.id !== id)); return; }
    await apiDeleteCategory(id);
    setApiData((prev) => (prev ?? []).filter((c) => c.id !== id));
  }, [isDemo, demo]);

  return { data, setData, hydrated, loading, error, isDemo: isDemo === true, refresh, create, remove } as const;
}

export function useTransactions() {
  const isDemo = useIsDemo();
  const seeded = useMemo(() => seedDemoTx(), []);
  const demo = useLocalArray<DemoTx>("duitku_demo_transactions", seeded);
  const [apiData, setApiData] = useState<UTx[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (isDemo === null) return;
    if (isDemo) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const rows = await listTransactions();
      setApiData(rows.map(mapApiTx));
    } catch (e: any) { setError(e?.message || "Gagal memuat transaksi"); }
    finally { setLoading(false); }
  }, [isDemo]);

  useEffect(() => { refresh(); }, [refresh]);

  const data: UTx[] = isDemo ? demo[0] : (apiData ?? []);
  const hydrated: boolean = isDemo ? demo[2] : !loading;
  const setData = isDemo ? demo[1] : (updater: any) => {
    setApiData((prev) => {
      const curr = prev ?? [];
      const next = typeof updater === "function" ? (updater as any)(curr) : updater;
      return next;
    });
  };

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
    setApiData((prev) => [mapped, ...(prev ?? [])]);
    return mapped;
  }, [isDemo, demo]);

  const remove = useCallback(async (id: string) => {
    if (isDemo) { demo[1]((prev) => prev.filter((t) => t.id !== id)); return; }
    await apiDeleteTx(id);
    setApiData((prev) => (prev ?? []).filter((t) => t.id !== id));
  }, [isDemo, demo]);

  // update transaksi (Supabase belum punya PATCH → delete+create; demo langsung map)
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
    // Supabase: soft-delete lalu create baru (jaga FK + RLS). ID baru valid.
    const existing = (apiData ?? []).find((t) => t.id === id);
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
    await apiDeleteTx(id);
    const created = await apiCreateTx(nextData as any);
    const mapped = mapApiTx(created);
    setApiData((prev) => (prev ?? []).filter((t) => t.id !== id).map((t) => t));
    setApiData((prev) => [mapped, ...(prev ?? []).filter((t) => t.id !== id)]);
    return mapped;
  }, [isDemo, demo, apiData]);

  const duplicate = useCallback(async (id: string) => {
    const src = (isDemo ? demo[0] : (apiData ?? [])).find((t) => t.id === id);
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
  }, [isDemo, demo, apiData, create]);

  return { data, setData, hydrated, loading, error, isDemo: isDemo === true, refresh, create, update, remove, duplicate } as const;
}

export function useBudgets() {
  const isDemo = useIsDemo();
  const demo = useLocalArray<DemoBudget>("duitku_demo_budgets", DEMO_BUDGETS);
  const [apiData, setApiData] = useState<UBudget[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (isDemo === null) return;
    if (isDemo) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const rows = await listBudgets();
      setApiData(rows.map(mapApiBudget));
    } catch (e: any) { setError(e?.message || "Gagal memuat anggaran"); }
    finally { setLoading(false); }
  }, [isDemo]);

  useEffect(() => { refresh(); }, [refresh]);

  const data: UBudget[] = isDemo ? demo[0] : (apiData ?? []);
  const hydrated: boolean = isDemo ? demo[2] : !loading;
  const setData = isDemo ? demo[1] : (updater: any) => {
    setApiData((prev) => {
      const curr = prev ?? [];
      const next = typeof updater === "function" ? (updater as any)(curr) : updater;
      return next;
    });
  };

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
    setApiData((prev) => [...(prev ?? []), mapped]);
    return mapped;
  }, [isDemo, demo]);

  const update = useCallback(async (id: string, patch: Partial<{ categoryId: string; amount: number; month: number; year: number }>) => {
    if (isDemo) {
      demo[1]((prev) => prev.map((b) => b.id === id ? { ...b, ...patch } as UBudget : b));
      return;
    }
    // API budgets PATCH hanya support amount; kalau ganti category/month/year → delete+create
    if (patch.amount !== undefined && patch.categoryId === undefined && patch.month === undefined && patch.year === undefined) {
      const b = await apiUpdateBudget(id, patch.amount as any);
      const mapped = mapApiBudget(b);
      setApiData((prev) => (prev ?? []).map((x) => x.id === id ? mapped : x));
      return mapped;
    }
    const existing = (apiData ?? []).find((b) => b.id === id);
    if (!existing) throw new Error("Budget tidak ditemukan");
    const next = { categoryId: patch.categoryId ?? existing.categoryId, amount: patch.amount ?? existing.amount, month: patch.month ?? existing.month, year: patch.year ?? existing.year };
    await apiDeleteBudget(id);
    const created = await apiCreateBudget(next as any);
    const mapped = mapApiBudget(created);
    setApiData((prev) => [...(prev ?? []).filter((b) => b.id !== id), mapped]);
    return mapped;
  }, [isDemo, demo, apiData]);

  const remove = useCallback(async (id: string) => {
    if (isDemo) { demo[1]((prev) => prev.filter((b) => b.id !== id)); return; }
    await apiDeleteBudget(id);
    setApiData((prev) => (prev ?? []).filter((b) => b.id !== id));
  }, [isDemo, demo]);

  return { data, setData, hydrated, loading, error, isDemo: isDemo === true, refresh, create, update, remove } as const;
}

export function useGoals() {
  const isDemo = useIsDemo();
  const demo = useLocalArray<DemoGoal>("duitku_demo_goals", DEMO_GOALS);
  const [apiData, setApiData] = useState<UGoal[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (isDemo === null) return;
    if (isDemo) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const rows = await listGoals();
      setApiData(rows.map(mapApiGoal));
    } catch (e: any) { setError(e?.message || "Gagal memuat tujuan"); }
    finally { setLoading(false); }
  }, [isDemo]);

  useEffect(() => { refresh(); }, [refresh]);

  const data: UGoal[] = isDemo ? demo[0] : (apiData ?? []);
  const hydrated: boolean = isDemo ? demo[2] : !loading;
  const setData = isDemo ? demo[1] : (updater: any) => {
    setApiData((prev) => {
      const curr = prev ?? [];
      const next = typeof updater === "function" ? (updater as any)(curr) : updater;
      return next;
    });
  };

  const create = useCallback(async (input: { name: string; targetAmount: number; currentAmount?: number; deadline?: string | null; icon?: string; color?: string }) => {
    if (isDemo) {
      const row: UGoal = { id: `g_${Date.now()}`, name: input.name, targetAmount: input.targetAmount, currentAmount: input.currentAmount ?? 0, deadline: input.deadline ?? null, icon: input.icon ?? "target", color: input.color ?? "#1a1a1a" };
      demo[1]((prev) => [...prev, row]);
      return row;
    }
    const g = await apiCreateGoal({ name: input.name, targetAmount: input.targetAmount, currentAmount: input.currentAmount ?? 0, deadline: input.deadline ?? null, icon: input.icon ?? "target", color: input.color ?? "#1a1a1a" } as any);
    const mapped = mapApiGoal(g);
    setApiData((prev) => [...(prev ?? []), mapped]);
    return mapped;
  }, [isDemo, demo]);

  const update = useCallback(async (id: string, patch: Partial<{ name: string; targetAmount: number; currentAmount: number; deadline: string | null; icon: string; color: string }>) => {
    if (isDemo) {
      demo[1]((prev) => prev.map((g) => g.id === id ? { ...g, ...patch } as UGoal : g));
      return;
    }
    const g = await apiUpdateGoal(id, patch as any);
    const mapped = mapApiGoal(g);
    setApiData((prev) => (prev ?? []).map((x) => x.id === id ? mapped : x));
    return mapped;
  }, [isDemo, demo]);

  const remove = useCallback(async (id: string) => {
    if (isDemo) { demo[1]((prev) => prev.filter((g) => g.id !== id)); return; }
    await apiDeleteGoal(id);
    setApiData((prev) => (prev ?? []).filter((g) => g.id !== id));
  }, [isDemo, demo]);

  const topup = useCallback(async (id: string, amount: number) => {
    if (isDemo) {
      demo[1]((prev) => prev.map((g) => g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g));
      return;
    }
    const existing = (apiData ?? []).find((g) => g.id === id);
    if (!existing) throw new Error("Tujuan tidak ditemukan");
    const g = await apiUpdateGoal(id, { currentAmount: existing.currentAmount + amount } as any);
    const mapped = mapApiGoal(g);
    setApiData((prev) => (prev ?? []).map((x) => x.id === id ? mapped : x));
    return mapped;
  }, [isDemo, demo, apiData]);

  return { data, setData, hydrated, loading, error, isDemo: isDemo === true, refresh, create, update, remove, topup } as const;
}
