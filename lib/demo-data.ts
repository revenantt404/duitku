export type DemoWallet = { id: string; name: string; type: "CASH" | "BANK" | "E_WALLET" | "INVESTMENT" | "OTHER"; color: string; icon: string; initialBalance: number };
export type DemoCategory = { id: string; name: string; icon: string; color: string; type: "INCOME" | "EXPENSE"; isSystem: boolean };
export type DemoTx = { id: string; walletId: string; toWalletId?: string | null; categoryId?: string | null; type: "INCOME" | "EXPENSE" | "TRANSFER"; amount: number; description?: string | null; date: string; transferId?: string | null };
export type DemoBudget = { id: string; categoryId: string; amount: number; month: number; year: number };
export type DemoGoal = { id: string; name: string; targetAmount: number; currentAmount: number; deadline?: string | null; icon: string; color: string };

// bump when demo defaults change — triggers localStorage reset via lib/use-data.ts & lib/demo-store.ts
export const DEMO_VERSION = "2";

// Demo start kosong — user isi manual (onboarding 3 langkah). Dompet tetap ada 4 tapi saldo 0 biar langsung bisa pilih dompet saat tambah transaksi.
export const DEMO_WALLETS: DemoWallet[] = [
  { id: "w1", name: "BCA", type: "BANK", color: "#171717", icon: "landmark", initialBalance: 0 },
  { id: "w2", name: "Cash", type: "CASH", color: "#525252", icon: "wallet", initialBalance: 0 },
  { id: "w3", name: "GoPay", type: "E_WALLET", color: "#737373", icon: "smartphone", initialBalance: 0 },
  { id: "w4", name: "Bibit", type: "INVESTMENT", color: "#a3a3a3", icon: "trending-up", initialBalance: 0 },
];

export const DEMO_CATEGORIES: DemoCategory[] = [
  { id: "c1", name: "Gaji", icon: "briefcase", color: "#171717", type: "INCOME", isSystem: true },
  { id: "c2", name: "Freelance", icon: "laptop", color: "#404040", type: "INCOME", isSystem: true },
  { id: "c3", name: "Makan", icon: "utensils", color: "#525252", type: "EXPENSE", isSystem: true },
  { id: "c4", name: "Transport", icon: "car", color: "#737373", type: "EXPENSE", isSystem: true },
  { id: "c5", name: "Belanja", icon: "shopping-bag", color: "#404040", type: "EXPENSE", isSystem: true },
  { id: "c6", name: "Tagihan", icon: "receipt", color: "#171717", type: "EXPENSE", isSystem: true },
  { id: "c7", name: "Hiburan", icon: "film", color: "#737373", type: "EXPENSE", isSystem: true },
  { id: "c8", name: "Kesehatan", icon: "heart", color: "#525252", type: "EXPENSE", isSystem: true },
];

// kosong — user input dari 0 (sebelumnya ada 13 dummy). Kosong bikin empty state onboarding lebih jelas.
export function seedDemoTx(): DemoTx[] {
  return [];
}

export const DEMO_BUDGETS: DemoBudget[] = [];
export const DEMO_GOALS: DemoGoal[] = [];
