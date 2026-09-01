# DuitKu — Setup 1 Halaman (copy-paste)

> Mau langsung coba tanpa ribet? **Mode Demo** sudah jalan tanpa Supabase — data di browser. Setup di bawah cuma kalau mau **data per akun beneran** (login Gmail/magic-link + simpan di cloud).

## Opsi A — Paling gampang: Vercel (tanpa isi .env manual)

1. Push repo ke GitHub.
2. Vercel Dashboard → **Add New Project** → import repo.
3. **Storage → Connect → Supabase** → pilih / buat project Supabase → **Connect**.  
   Vercel otomatis isi `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — gak perlu copy manual.
4. Deploy. Selesai. `postinstall: prisma generate` sudah otomatis jalan di build.

> Google login **opsional** — bisa nyusul. Login termudah sudah **Link email (magic-link)** tanpa setup Google Cloud.

## Opsi B — Lokal (butuh Supabase beneran)

```bash
# 1. Env — di Vercel udah auto, di lokal copy & isi:
cp .env.example .env
# isi di Supabase Dashboard → Project → Settings → API + Database:
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# DATABASE_URL, DIRECT_URL (pakai password DB kamu)

# 2. Bikin tabel (cukup 1x, atau tiap ganti schema):
npx prisma db push

# 3. Isi kategori sistem (Makan, Transport, dll):
npx tsx prisma/seed.ts

# 4. Jalanin:
npm run dev
# → http://localhost:3000
```

Tips `!` di chat ini: ketik `! npx prisma db push` atau `! npx tsx prisma/seed.ts` biar output langsung keliatan di sini.

## Login — 3 cara (paling gampang dulu)

| Cara | Kapan pakai | Setup |
|---|---|---|
| **Link email** (default) | Paling gampang — tanpa Google | Gak perlu. User isi email → klik **Kirim link login** → cek inbox/spam → klik link (1x pakai). |
| **Email + password** | Kalau mau password klasik | Gak perlu. Tab **Password** di `/login`. |
| **Google** | Opsional, bisa nyusul | Supabase → Auth → Providers → Google ON → isi Client ID/Secret dari Google Cloud Console. |

Mode Demo: kalau `.env` masih `placeholder`/`localhost:54321`, tombol **Masuk Demo** / **Kirim link** langsung masuk tanpa Supabase. Banner "Demo" muncul di atas.

## Verifikasi build (wajib pass sebelum deploy)

```bash
! rmdir /s /q .next & npm run build
```

Harus `✓ Compiled successfully` tanpa error. Warning `useEffect missing dep` sudah di-ignore — aman.

## Checklist cepat

- [ ] Env keisi (Vercel: auto via Connect; Lokal: `.env` terisi)
- [ ] `npx prisma db push` sukses
- [ ] `npx tsx prisma/seed.ts` sukses (12 kategori sistem)
- [ ] `npm run build` pass
- [ ] Login coba: link email masuk → dashboard kebuka
- [ ] (opsional) Google OAuth nyala kalau mau

## Kalau error

- `Can't reach database` → cek `DATABASE_URL`/`DIRECT_URL` + password benar, project Supabase gak di-pause.
- `Invalid API key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` salah — copy lagi dari Settings → API.
- Link email gak masuk → cek spam, atau di Supabase → Auth → Email Templates → pastikan redirect ke `https://duitku.vercel.app/auth/callback` (atau `http://localhost:3000/auth/callback` buat lokal).
