# DuitKu — Setup 1 Halaman (copy-paste)

> Ikuti langkah di bawah untuk setup Supabase + Auth agar data tersimpan per akun di cloud.

## Opsi A — Paling gampang: Vercel (tanpa isi .env manual)

1. Push repo ke GitHub.
2. Vercel Dashboard → **Add New Project** → import repo.
3. **Storage → Connect → Supabase** → pilih / buat project Supabase → **Connect**.  
   Vercel otomatis isi `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — gak perlu copy manual.
4. Deploy. Selesai. `postinstall: prisma generate` sudah otomatis jalan di build.

> Login utama: **Google** (disarankan) atau **email + password**. Google bisa setup belakangan — email/password tetap bisa dipakai.

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

## Login — 2 cara

| Cara | Kapan pakai | Setup |
|---|---|---|
| **Google** (disarankan) | Paling cepat — 1 klik | Supabase → Auth → Providers → Google ON → isi Client ID/Secret dari Google Cloud Console. |
| **Email + password** | Alternatif / fallback | Gak perlu setup tambahan. Langsung di `/login`. |

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
- [ ] Login coba: Google atau email/password masuk → dashboard kebuka
- [ ] Google OAuth nyala (disarankan)

## Kalau error

- `Can't reach database` → cek `DATABASE_URL`/`DIRECT_URL` + password benar, project Supabase gak di-pause.
- `Invalid API key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` salah — copy lagi dari Settings → API.
- Login gagal / redirect aneh → cek Supabase → Auth → URL Configuration → Site URL & Redirect URLs sudah include `https://duitku.vercel.app/auth/callback` (dan `http://localhost:3000/auth/callback` buat lokal).

## Catatan Developer (opsional — lokal tanpa Supabase)

Fallback `localStorage` masih ada di kode (`lib/demo.ts`, `lib/demo-data.ts`). Cek `README.md` bagian 8 untuk cara pakai. Tidak muncul di UI produksi.
