/**
 * API client untuk mode Supabase (non-demo).
 * Semua angka BigInt dari Prisma dikirim sebagai string → normalisasi ke number di sini.
 * Dipakai oleh lib/use-data.ts; tidak dipanggil saat isDemoModeClient() === true.
 */

type FetchOpts = RequestInit & { rawQuery?: string };

async function req<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-json
  }
  if (!res.ok) {
    const msg =
      (json && (json.error?.message || json.error || json.message)) ||
      text ||
      `Request failed ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return json as T;
}

// Normalisasi BigInt-string → number (IDR aman < 9e15, masih safe dalam Number)
function toNum(v: unknown): number {
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

// --- Types ternormalisasi untuk UI (number, ISO string) ---
export type ApiWallet = {
  id: string;
  name: string;
  type: "CASH" | "BANK" | "E_WALLET" | "INVESTMENT" | "OTHER";
  color: string;
  icon: string;
  initialBalance: number;
  createdAt?: string;
};
export type ApiCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "INCOME" | "EXPENSE";
  isSystem: boolean;
};
export type ApiTx = {
  id: string;
  walletId: string;
  toWalletId: string | null;
  categoryId: string | null;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string | null;
  date: string; // ISO
  transferId: string | null;
  createdAt?: string;
};
export type ApiBudget = {
  id: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
};
export type ApiGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  icon: string;
  color: string;
};

// --- Wallets ---
export async function listWallets(): Promise<ApiWallet[]> {
  const raw: any[] = await req("/api/wallets");
  return raw.map((w) => ({
    ...w,
    initialBalance: toNum(w.initialBalance),
  }));
}
export async function createWallet(input: {
  name: string;
  type: ApiWallet["type"];
  color: string;
  icon: string;
  initialBalance: number | string;
}): Promise<ApiWallet> {
  const w: any = await req("/api/wallets", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return { ...w, initialBalance: toNum(w.initialBalance) };
}
export async function updateWallet(
  id: string,
  patch: Partial<{
    name: string;
    type: ApiWallet["type"];
    color: string;
    icon: string;
    initialBalance: number | string;
  }>
): Promise<ApiWallet> {
  const w: any = await req("/api/wallets", {
    method: "PATCH",
    body: JSON.stringify({ id, ...patch }),
  });
  return { ...w, initialBalance: toNum(w.initialBalance) };
}
export async function deleteWallet(id: string): Promise<void> {
  await req(`/api/wallets?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

// --- Categories ---
export async function listCategories(): Promise<ApiCategory[]> {
  return await req("/api/categories");
}
export async function createCategory(input: {
  name: string;
  icon: string;
  color: string;
  type: "INCOME" | "EXPENSE";
}): Promise<ApiCategory> {
  return await req("/api/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
export async function deleteCategory(id: string): Promise<void> {
  await req(`/api/categories?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

// --- Transactions ---
export async function listTransactions(params?: {
  month?: string; // YYYY-MM
  type?: string;
  q?: string;
}): Promise<ApiTx[]> {
  const usp = new URLSearchParams();
  if (params?.month) usp.set("month", params.month);
  if (params?.type) usp.set("type", params.type);
  if (params?.q) usp.set("q", params.q);
  const qs = usp.toString();
  const raw: any[] = await req(`/api/transactions${qs ? `?${qs}` : ""}`);
  return raw.map((t) => ({
    ...t,
    amount: toNum(t.amount),
    date: typeof t.date === "string" ? t.date : new Date(t.date).toISOString(),
  }));
}
export async function createTransaction(input: {
  walletId: string;
  toWalletId?: string | null;
  categoryId?: string | null;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number | string;
  description?: string | null;
  date?: string | Date | null;
}): Promise<ApiTx> {
  const t: any = await req("/api/transactions", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      // kirim Date sebagai ISO kalau bukan string
      date: input.date instanceof Date ? input.date.toISOString() : input.date,
    }),
  });
  return { ...t, amount: toNum(t.amount) };
}
export async function deleteTransaction(id: string): Promise<void> {
  await req(`/api/transactions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}
export async function updateTransaction(
  id: string,
  patch: Partial<{
    walletId: string;
    toWalletId: string | null;
    categoryId: string | null;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    amount: number | string;
    description: string | null;
    date: string | Date | null;
  }>
): Promise<void> {
  // API utama belum ada PATCH transaksi (pakai DELETE+POST di UI),
  // tapi siapin kalau nanti ditambah. Fallback: lempar biar caller pakai delete+create.
  const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      ...patch,
      date: patch.date instanceof Date ? patch.date.toISOString() : patch.date,
    }),
  });
  if (res.status === 404) {
    // endpoint belum ada — signal ke caller
    throw new Error("PATCH /api/transactions/:id belum tersedia");
  }
  if (!res.ok) throw new Error(await res.text());
}

// --- Budgets ---
export async function listBudgets(params?: { month?: number; year?: number }): Promise<ApiBudget[]> {
  const usp = new URLSearchParams();
  if (params?.month) usp.set("month", String(params.month));
  if (params?.year) usp.set("year", String(params.year));
  const qs = usp.toString();
  const raw: any[] = await req(`/api/budgets${qs ? `?${qs}` : ""}`);
  return raw.map((b) => ({ ...b, amount: toNum(b.amount) }));
}
export async function createBudget(input: {
  categoryId: string;
  amount: number | string;
  month: number;
  year: number;
}): Promise<ApiBudget> {
  const b: any = await req("/api/budgets", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return { ...b, amount: toNum(b.amount) };
}
export async function updateBudget(id: string, amount: number | string): Promise<ApiBudget> {
  const b: any = await req("/api/budgets", {
    method: "PATCH",
    body: JSON.stringify({ id, amount }),
  });
  return { ...b, amount: toNum(b.amount) };
}
export async function deleteBudget(id: string): Promise<void> {
  await req(`/api/budgets?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

// --- Goals ---
export async function listGoals(): Promise<ApiGoal[]> {
  const raw: any[] = await req("/api/goals");
  return raw.map((g) => ({
    ...g,
    targetAmount: toNum(g.targetAmount),
    currentAmount: toNum(g.currentAmount),
  }));
}
export async function createGoal(input: {
  name: string;
  targetAmount: number | string;
  currentAmount?: number | string;
  deadline?: string | Date | null;
  icon?: string;
  color?: string;
}): Promise<ApiGoal> {
  const g: any = await req("/api/goals", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      deadline: input.deadline instanceof Date ? input.deadline.toISOString() : input.deadline,
    }),
  });
  return {
    ...g,
    targetAmount: toNum(g.targetAmount),
    currentAmount: toNum(g.currentAmount),
  };
}
export async function updateGoal(
  id: string,
  patch: Partial<{
    name: string;
    targetAmount: number | string;
    currentAmount: number | string;
    deadline: string | Date | null;
    icon: string;
    color: string;
  }>
): Promise<ApiGoal> {
  const g: any = await req("/api/goals", {
    method: "PATCH",
    body: JSON.stringify({
      id,
      ...patch,
      deadline: patch.deadline instanceof Date ? (patch.deadline as Date).toISOString() : patch.deadline,
    }),
  });
  return {
    ...g,
    targetAmount: toNum(g.targetAmount),
    currentAmount: toNum(g.currentAmount),
  };
}
export async function deleteGoal(id: string): Promise<void> {
  await req(`/api/goals?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}
