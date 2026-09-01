"use client";
import { useEffect, useState } from "react";
import { DEMO_WALLETS, DEMO_CATEGORIES, DEMO_BUDGETS, DEMO_GOALS, DEMO_VERSION, seedDemoTx, type DemoWallet, type DemoCategory, type DemoTx, type DemoBudget, type DemoGoal } from "./demo-data";

const KEYS = {
  wallets: "duitku_demo_wallets",
  categories: "duitku_demo_categories",
  transactions: "duitku_demo_transactions",
  budgets: "duitku_demo_budgets",
  goals: "duitku_demo_goals",
} as const;

function useLocalArray<T>(key: string, initial: T[]) {
  const [data, setData] = useState<T[]>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const ver = localStorage.getItem("duitku_demo_version");
      if (ver !== DEMO_VERSION) {
        Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
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

export function useDemoWallets() { return useLocalArray<DemoWallet>(KEYS.wallets, DEMO_WALLETS); }
export function useDemoCategories() { return useLocalArray<DemoCategory>(KEYS.categories, DEMO_CATEGORIES); }
export function useDemoTransactions() {
  const seeded = seedDemoTx();
  return useLocalArray<DemoTx>(KEYS.transactions, seeded);
}
export function useDemoBudgets() { return useLocalArray<DemoBudget>(KEYS.budgets, DEMO_BUDGETS); }
export function useDemoGoals() { return useLocalArray<DemoGoal>(KEYS.goals, DEMO_GOALS); }

export function resetDemoData() {
  try {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem("duitku_demo_user");
    localStorage.removeItem("duitku_demo_version");
  } catch {}
}
