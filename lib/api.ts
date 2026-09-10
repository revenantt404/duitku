/**
 * API client untuk mode Supabase (non-demo).
 * Semua angka BigInt dari Prisma dikirim sebagai string → normalisasi ke number di sini.
 * Dipakai oleh lib/use-data.ts; tidak dipanggil saat isDemoModeClient() === true.
 */

type FetchOpts = RequestInit & { rawQuery?: string; timeoutMs?: number };

export const API_TIMEOUT_MS = 12_000;

// Server kini fail-fast: auth ≤4 dtk, tiap tahap DB ≤3 dtk (worst-case GET ~10 dtk).
// Timeout client tetap 12 dtk sebagai guard terakhir; backoff di bawah menangani
// 503 transien (cold start / pooler sibuk) tanpa membanjiri server.
const MAX_RETRIES = 1;
const RETRY_BASE_DELAY_MS = 800;

function isTimeoutError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "TimeoutError";
}

function isRetryable(e: unknown): boolean {
  if (e instanceof Error) {
    if (e.name === "AbortError" || e.name === "TimeoutError") return true;
    if (/503|timeout|lambat|koneksi database|fetch failed|network/i.test(e.message)) return true;
  }
  return e instanceof TypeError; // network failure
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Pesan 503/timeout server → ringkas agar watchdog/panel error enak dibaca.
function prettifyServerError(msg: string): string {
  if (/timeout/i.test(msg)) {
    return "Server sibuk/lambat — coba lagi sebentar (cek koneksi database di Vercel bila berulang).";
  }
  if (/belum dikonfigurasi/i.test(msg)) {
    return "Konfigurasi database server belum lengkap — hubungi admin (DATABASE_URL/DIRECT_URL).";
  }
  return msg;
}

async function fetchOnce<T>(path: string, opts: FetchOpts, timeoutMs: number): Promise<T> {
  const { rawQuery: _rawQuery, ...init } = opts;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(path, {
      credentials: "include",
      headers: { "content-type": "application/json", ...(init.headers || {}) },
      ...init,
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (isTimeoutError(e) || (e instanceof Error && e.name === "AbortError")) {
      throw new Error(`Server lama merespons (> ${Math.round(timeoutMs / 1000)} dtk) — coba Muat ulang`);
    }
    throw e;
  }
  clearTimeout(timer);
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
    const raw = typeof msg === "string" ? msg : JSON.stringify(msg);
    throw new Error(res.status === 503 ? prettifyServerError(raw) : raw);
  }
  return json as T;
}

async function req<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { timeoutMs = API_TIMEOUT_MS } = opts;
  // Retry 1x khusus GET idempoten: aman, menolong saat cold start Vercel.
  // POST/PATCH/DELETE tidak di-retry (tidak idempoten).
  const method = String((opts as RequestInit).method || "GET").toUpperCase();
  const retries = method === "GET" ? MAX_RETRIES : 0;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchOnce<T>(path, opts, timeoutMs);
    } catch (e) {
      lastErr = e;
      if (attempt < retries && isRetryable(e)) {
        await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
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
export async function updateCategory(
  id: string,
  patch: Partial<{ name: string; icon: string; color: string; type: "INCOME" | "EXPENSE" }>
): Promise<ApiCategory> {
  return await req("/api/categories", {
    method: "PATCH",
    body: JSON.stringify({ id, ...patch }),
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
