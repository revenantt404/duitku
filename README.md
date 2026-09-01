# DuitKu — Catat Duit, Jelas Hidup

Website manajemen uang: pemasukan, pengeluaran, multi-dompet, budgeting, tujuan tabungan.  
**Stack:** Next.js 14 App Router + Tailwind + shadcn/ui + Supabase (Postgres + Auth) + Prisma + Recharts + Zod — deploy ke Vercel.

> Hasil grill 3 ronde: Multi-User terisolasi, Multi-Dompet, 3 tipe transaksi `INCOME/EXPENSE/TRANSFER`, kategori hybrid, soft-delete, BigInt Rupiah, mobile-first responsive.

---

## 1. Jalankan Lokal (Mode Demo — Tanpa Supabase)

Mode demo pakai `localStorage` + data dummy, jadi bisa langsung jalan tanpa config DB.

```bash
npm install
npm run dev
# buka http://localhost:3000
# klik "Masuk" → "Buka Dashboard Demo Tanpa Login"
```

- Dashboard, Transaksi, Dompet, Anggaran, Tujuan semua berfungsi dengan data dummy yang bisa diedit.
- Data tersimpan di `localStorage` (`duitku_demo_*`), hapus via DevTools → Application → Local Storage untuk reset.

---

## 2. Setup Supabase (Untuk Data Beneran)

### A. Buat Project Supabase
1. https://supabase.com → New Project → simpan password DB.
2. Dashboard → **Project Settings → API** → copy `Project URL` & `anon public key` & `service_role key`.
3. Dashboard → **Project Settings → Database** → copy `Connection string` (URI).

### B. Isi Env
```bash
cp .env.example .env.local
# edit .env.local
```
Isi:
```
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```
> `DATABASE_URL` pakai pgbouncer (port 6543) untuk Vercel Serverless, `DIRECT_URL` tanpa pgbouncer untuk migrate.

### C. Push Schema & Seed
```bash
npx prisma db push
npx prisma generate
# seed kategori sistem (opsional, butuh tsx)
npx tsx prisma/seed.ts
# atau
npm run db:push
```

### D. Auth Google (Opsional)
Supabase Dashboard → **Authentication → Providers → Google** → enable, isi Client ID/Secret dari Google Cloud Console.  
Atur **Site URL** = `http://localhost:3000` (dan nanti `https://duitku.vercel.app`) dan **Redirect URL** include `http://localhost:3000/auth/callback`.

### E. Row Level Security (RLS)
Aktifkan RLS di Supabase agar user A tidak bisa baca data user B:
```sql
alter table "Wallet" enable row level security;
alter table "Transaction" enable row level security;
-- dst untuk Category, Budget, Goal
create policy "user_isolation_wallet" on "Wallet" for all using (auth.uid()::text = "userId");
create policy "user_isolation_tx" on "Transaction" for all using (auth.uid()::text = "userId");
```

---

## 3. Struktur Folder

```
app/
  page.tsx                 # Landing
  globals.css
  layout.tsx
  (auth)/login/page.tsx    # Supabase Auth + Mode Demo
  auth/callback/route.ts   # OAuth callback
  (dashboard)/
    layout.tsx             # AppShell (sidebar + bottom nav)
    dashboard/page.tsx     # Saldo total + Donut + Bar 6 bulan + insight
    transaksi/page.tsx     # List + filter bulan + search + soft-delete
    dompet/page.tsx        # CRUD Wallet + saldo per wallet (warning minus)
    anggaran/page.tsx      # Budget per kategori + progress bar
    tujuan/page.tsx        # Goals + progress + nabung
components/
  ui/*, app-shell.tsx, transaction-form.tsx, wallet-card.tsx
  charts/expense-donut.tsx, monthly-bar.tsx
lib/
  utils.ts, prisma.ts, validations.ts (Zod), demo-data.ts, demo-store.ts
  supabase/{client,server,middleware}.ts
prisma/schema.prisma       # BigInt amount, soft-delete, transferId
```

---

## 4. Aturan Emas (Jangan Dilanggar)

1. **Rupiah = BigInt, bukan Float.** `amount` simpan sebagai `BigInt` (satuan rupiah). Di UI pakai `formatRupiah()` / `formatRupiahCompact()`. Validasi `z.coerce.number().int().positive()`.
2. **Tanggal = UTC di DB, WIB di UI.** Simpan `Date` UTC, tampil pakai `formatWIB()` / `formatDateShort()` (`Asia/Jakarta`).
3. **Saldo jangan di-cache manual.** Hitung `initialBalance + sum(INCOME) - sum(EXPENSE) ± TRANSFER`. Kalau mau cache, update via `prisma.$transaction`.
4. **Transfer = 1 transaksi tipe TRANSFER** dengan `walletId` + `toWalletId` + `transferId` yang sama. Jangan pecah jadi 2 transaksi manual.
5. **Soft-delete.** Jangan `delete` beneran, set `deletedAt = now()`. Laporan filter `deletedAt is null`.

---

## 5. Deploy ke Vercel

1. Push repo ke GitHub.
2. Vercel → New Project → Import GitHub → Framework `Next.js`.
3. Set Environment Variables (sama seperti `.env.local`).
4. Deploy → dapat `duitku.vercel.app`. Beli domain `.my.id` nanti kalau sudah 50+ user.
5. Di Supabase, tambahkan `https://duitku.vercel.app/auth/callback` ke Redirect URLs.

Gratis: Vercel Hobby 100GB bandwidth, Supabase 500MB DB — cukup untuk 1000 user aktif. Pasang **Vercel Analytics** + **Prisma + Server Components + caching** biar tidak jebol.

---

## 6. Roadmap 3 Minggu

- **Minggu 1:** Auth + CRUD Wallet + CRUD Transaksi (FAB <10 detik) + Kategori Hybrid — Zod validasi jalan.
- **Minggu 2:** Dashboard saldo + Donut + Bar 6 bulan + Filter bulan + Soft Delete + Mobile-first polish.
- **Minggu 3:** Budget + Goals + Warning saldo minus + Empty state + Deploy.

---

## 7. Troubleshooting

- **Build error `NEXT_PUBLIC_SUPABASE_URL` missing** → isi `.env.local` atau pakai Mode Demo (otomatis fallback ke localStorage).
- **Prisma `Can't reach database`** → cek `DATABASE_URL` pakai `?pgbouncer=true` untuk Vercel, `DIRECT_URL` untuk `db push`.
- **Saldo tidak balance** → cek transaksi `TRANSFER` tidak double-count, dan `deletedAt` sudah difilter.

---

## Lisensi

MIT — bebas pakai untuk personal/UMKM.
