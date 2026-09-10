"use client";
import { useState } from "react";
import Link from "next/link";
import { LoginDialog } from "@/components/login-dialog";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Check,
  Eye,
  Landmark,
  LogIn,
  PieChart,
  Play,
  Plus,
  Receipt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ticker = [
  "Multi-dompet rapi",
  "Budget bulanan",
  "Grafik jujur",
  "Export CSV",
  "Login Google",
  "Tanpa iklan",
  "IDR BigInt akurat",
];

const stats = [
  { icon: Zap, label: "Kecepatan", value: "< 10 dtk", desc: "1 transaksi tercatat", chip: "sat-set" },
  { icon: Wallet, label: "Dompet", value: "3+ dompet", desc: "Cash / Bank / eWallet", chip: "rapi" },
  { icon: ShieldCheck, label: "Keamanan", value: "100% milikmu", desc: "BigInt + RLS per user", chip: "terjaga" },
];

const wallets = [
  { icon: Landmark, n: "BCA", t: "BANK · ··4821", a: "Rp 8.100.000", trend: "+12%", up: true },
  { icon: Banknote, n: "Cash", t: "CASH · dompet fisik", a: "Rp 2.350.000", trend: "stabil", up: true },
  { icon: Smartphone, n: "GoPay", t: "E-WALLET · ··7740", a: "Rp 500.000", trend: "-8%", up: false },
];

const features = [
  { num: "01", icon: Wallet, title: "Multi-dompet rapi", desc: "Cash, BCA, GoPay, investasi dipisah. Transfer tidak merusak laporan." },
  { num: "02", icon: PieChart, title: "Grafik jujur", desc: "Donut per kategori + bar 6 bulan. Warm, langsung keliatan borosnya." },
  { num: "03", icon: Target, title: "Budget & goals", desc: "Limit makan 1,5jt/bulan. Nabung iPhone progress 40%." },
  { num: "04", icon: ShieldCheck, title: "Data aman", desc: "BigInt Rupiah, soft-delete, RLS per user. Minus boleh, tapi keliatan." },
  { num: "05", icon: Smartphone, title: "Input 10 detik", desc: "FAB → nominal → kategori → dompet → simpan. Tanpa distraksi." },
  { num: "06", icon: TrendingUp, title: "Gratis di Vercel", desc: "Next.js + Supabase + Prisma. Deploy ke duitku.vercel.app." },
];

const steps = [
  { icon: LogIn, n: "1", title: "Login 30 detik", desc: "Pakai Google, langsung masuk. Tanpa kartu kredit." },
  { icon: Zap, n: "2", title: "Catat 10 detik", desc: "Nominal → kategori → dompet → simpan. Sat-set." },
  { icon: PieChart, n: "3", title: "Lihat grafik jujur", desc: "Donut + bar 6 bulan nunjukin ke mana duit pergi." },
];

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  return (
    <div className="min-h-screen bg-paper dark:bg-[#141414] text-ink dark:text-[#e9e6e2]">
      {/* Sticky header — inner tetap 720px */}
      <header className="sticky top-0 z-30 border-b hairline bg-paper dark:bg-[#141414]">
        <div className="max-w-[720px] mx-auto px-6 md:px-0 py-3.5 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-full bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] grid place-items-center text-[10px] font-bold">Rp</span>
            <span className="text-[18px] font-[500] tracking-tight">duitku.</span>
            <span className="hidden sm:inline text-[11px] text-mute dark:text-[#8f8b85] border hairline rounded-full px-2 py-0.5">warm</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setLoginOpen(true)}>Mulai <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} /></Button>
          </div>
        </div>
      </header>
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />

      <main className="max-w-[720px] mx-auto px-6 md:px-0 pb-24">
        {/* ===== HERO ===== */}
        <section className="relative pt-10 sm:pt-14 pb-10">

          {/* eyebrow */}
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="group inline-flex items-center gap-2 rounded-full border hairline bg-white dark:bg-[#1d1d1d] py-1 pl-1.5 pr-2.5 text-[12px] font-medium shadow-sm transition hover:-translate-y-px text-left"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-ink dark:bg-[#e9e6e2] px-2 py-0.5 text-[11px] font-semibold text-paper dark:text-[#141414]">
              <Sparkles className="h-3 w-3" strokeWidth={2} /> Baru
            </span>
            <span className="text-mute dark:text-[#a7a39d]">Import CSV + budget pintar</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-px group-hover:translate-x-px" strokeWidth={1.75} />
          </button>

          {/* headline — campuran solid + outline + pill + italic + squiggle: hidup, tetap paper/ink */}
          <h1 className="relative mt-5 font-display text-[44px] sm:text-[64px] font-[300] tracking-[-0.04em] leading-[0.98]">
            <span className="animate-hero-rise block">
              Catat <span className="text-outline font-[500]">duit,</span>
            </span>
            <span className="animate-hero-rise mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-2 sm:gap-x-3" style={{ animationDelay: "120ms" }}>
              <span className="inline-flex -rotate-2 items-center rounded-[16px] sm:rounded-[20px] bg-ink px-3.5 sm:px-5 py-0.5 sm:py-1 text-paper dark:bg-[#e9e6e2] dark:text-[#141414] font-[500] shadow-sm">
                jelas
              </span>
              <span className="relative inline-block italic font-[500]">
                hidup.
                <svg className="absolute -bottom-1.5 sm:-bottom-2 left-0 w-full overflow-visible text-ink dark:text-[#e9e6e2]" viewBox="0 0 220 12" fill="none" preserveAspectRatio="none" aria-hidden>
                  <path className="squiggle-path" pathLength={1} d="M3 9C40 2 80 11 115 6s75-3 102 1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
              <span className="relative ml-1 inline-flex -translate-y-1 align-middle text-ink dark:text-[#e9e6e2]" aria-hidden title="Rp">
                <span className="absolute -inset-1">
                  <svg viewBox="0 0 48 48" className="h-full w-full" fill="none">
                    <circle cx="24" cy="24" r="21" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="3 6" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="grid h-10 w-10 sm:h-12 sm:w-12 rotate-6 place-items-center rounded-full bg-ink text-paper shadow-sm dark:bg-[#e9e6e2] dark:text-[#141414]">
                  <span className="text-[11px] sm:text-[12px] font-bold tracking-tight">Rp</span>
                </span>
              </span>
            </span>
          </h1>

          <p className="animate-hero-rise mt-5 text-[15px] leading-[1.75] text-mute dark:text-[#a7a39d] max-w-[48ch]" style={{ animationDelay: "220ms" }}>
            DuitKu bikin <strong className="font-semibold text-ink dark:text-[#e9e6e2]">10 detik per transaksi</strong> terasa
            enteng. <strong className="font-semibold text-ink dark:text-[#e9e6e2]">Multi-dompet</strong>, budgeting,
            dan <strong className="font-semibold text-ink dark:text-[#e9e6e2]">grafik jujur</strong> — warm paper,
            tegas, tanpa distraksi.
          </p>

          {/* CTA */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <Button onClick={() => setLoginOpen(true)} className="group h-12 px-7 text-[15px] w-full sm:w-auto">
              Mulai — Gratis
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={1.75} />
            </Button>
            <a href="#demo">
              <Button variant="outline" className="h-12 px-5 text-[14px] w-full sm:w-auto bg-white/60 dark:bg-[#1d1d1d]/60">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-paper dark:bg-[#e9e6e2] dark:text-[#141414]">
                  <Play className="h-3 w-3 fill-current" />
                </span>
                Lihat demo 1 menit
              </Button>
            </a>
          </div>
          <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-mute dark:text-[#8f8b85]">
            {["Gratis selamanya", "Tanpa kartu kredit", "Login Google 30 detik"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" strokeWidth={2.25} /> {t}
              </span>
            ))}
          </div>

          {/* social proof */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex -space-x-2">
              {[
                { t: "NA", c: "bg-ink text-paper dark:bg-[#e9e6e2] dark:text-[#141414]" },
                { t: "BP", c: "bg-white dark:bg-[#1d1d1d] border hairline" },
                { t: "DR", c: "bg-[#f3f1ec] dark:bg-[#2a2a2a]" },
                { t: "+", c: "bg-ink text-paper dark:bg-[#e9e6e2] dark:text-[#141414]" },
              ].map((a, i) => (
                <span
                  key={i}
                  className={`grid h-8 w-8 place-items-center rounded-full text-[10px] font-bold ring-2 ring-paper dark:ring-[#141414] ${a.c}`}
                >
                  {a.t}
                </span>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5 text-ink dark:text-[#e9e6e2]" aria-label="rating 4.9 dari 5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                ))}
                <span className="ml-1.5 text-[12px] font-semibold num">4.9/5</span>
              </div>
              <div className="text-[12px] text-mute dark:text-[#8f8b85]">dari 2.400+ perencana keuangan kos</div>
            </div>
          </div>

          {/* stats bento */}
          <div className="mt-7 grid grid-cols-3 gap-3 text-left">
            {stats.map((s) => (
              <div
                key={s.label}
                className="group relative overflow-hidden rounded-[18px] bg-white dark:bg-[#1d1d1d] border hairline px-3 py-3 sm:p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="absolute inset-x-3 top-0 h-px bg-ink/15 dark:bg-white/15" />
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#f3f1ec] dark:bg-[#2a2a2a] border hairline">
                    <s.icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="rounded-full border hairline px-1.5 py-0.5 text-[10px] font-medium text-mute dark:text-[#8f8b85]">
                    {s.chip}
                  </span>
                </div>
                <div className="mt-2.5 text-[19px] sm:text-[22px] font-semibold tracking-tight num leading-none">{s.value}</div>
                <div className="mt-1 text-[11px] sm:text-[12px] text-mute dark:text-[#8f8b85] leading-snug">{s.desc}</div>
              </div>
            ))}
          </div>

          {/* ticker */}
          <div className="mt-6 overflow-hidden rounded-full border hairline bg-white dark:bg-[#1d1d1d] py-2.5 marquee-mask">
            <div className="animate-marquee flex w-max items-center whitespace-nowrap">
              {[0, 1].map((copy) => (
                <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
                  {ticker.map((t) => (
                    <span key={`${copy}-${t}`} className="flex items-center text-[12px] font-medium tracking-wide text-mute dark:text-[#a7a39d]">
                      <span className="px-4">{t}</span>
                      <span className="text-[10px] opacity-60">✦</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Window mockup / demo ===== */}
        <section id="demo" className="pb-10 scroll-mt-28">
          <div className="rounded-[20px] bg-white dark:bg-[#1d1d1d] border hairline overflow-hidden panel-shadow">
            {/* titlebar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#f3f1ec] dark:bg-[#222] border-b hairline">
              <span className="flex gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-ink/70 dark:bg-[#e9e6e2]/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-ink/25 dark:bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-ink/25 dark:bg-white/20" />
              </span>
              <span className="hidden sm:inline-flex flex-1 justify-center">
                <span className="rounded-full border hairline bg-white dark:bg-[#1d1d1d] px-3 py-0.5 text-[11px] text-mute dark:text-[#a7a39d] num">
                  duitku.app/dashboard
                </span>
              </span>
              <span className="ml-auto sm:ml-0 inline-flex items-center gap-1.5 text-[11px] text-mute dark:text-[#8f8b85] border hairline rounded-full px-2 py-0.5 bg-white dark:bg-[#1d1d1d]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ink dark:bg-[#e9e6e2] opacity-50" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-ink dark:bg-[#e9e6e2]" />
                </span>
                live preview
              </span>
            </div>

            <div className="p-4 space-y-3">
              {/* balance — inverted panel, flat biar gak banding */}
              <div className="relative overflow-hidden rounded-[18px] bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] p-5">
                <div className="relative flex items-center justify-between gap-2">
                  <div className="text-[11px] font-medium tracking-[0.12em] uppercase opacity-70">Total Saldo · Sep 2026</div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 dark:bg-black/10 px-2 py-0.5 text-[11px] font-semibold num">
                      <TrendingUp className="h-3 w-3" strokeWidth={2.25} /> +12,4%
                    </span>
                    <Eye className="h-4 w-4 opacity-60" strokeWidth={1.75} />
                  </div>
                </div>
                <div className="relative mt-1 text-[28px] sm:text-[32px] font-semibold tracking-tight num">Rp 12.450.000</div>
                <svg viewBox="0 0 200 48" className="relative mt-3 h-12 w-full" fill="none" aria-hidden>
                  <path
                    d="M0 38 C 20 36, 30 28, 45 30 S 70 38, 85 30 S 110 12, 130 16 S 165 30, 200 8"
                    stroke="currentColor"
                    strokeOpacity="0.9"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="200" cy="8" r="3.5" fill="currentColor" />
                </svg>
                <div className="relative mt-3 grid grid-cols-3 gap-3 text-[11px] border-t border-white/15 dark:border-black/15 pt-3">
                  <div><div className="tracking-[0.1em] opacity-60">MASUK</div><div className="font-semibold mt-0.5 num text-[13px]">Rp 8,2 jt</div></div>
                  <div className="border-l border-white/15 dark:border-black/15 pl-3"><div className="tracking-[0.1em] opacity-60">KELUAR</div><div className="font-semibold mt-0.5 num text-[13px]">Rp 3,78 jt</div></div>
                  <div className="border-l border-white/15 dark:border-black/15 pl-3"><div className="tracking-[0.1em] opacity-60">SISA</div><div className="font-semibold mt-0.5 num text-[13px]">Rp 4,42 jt</div></div>
                </div>
              </div>

              {/* quick-add mock */}
              <div className="flex items-center gap-2 rounded-full border hairline bg-white dark:bg-[#1d1d1d] p-1.5 pl-3.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-paper dark:bg-[#e9e6e2] dark:text-[#141414] shrink-0">
                  <Plus className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <span className="flex-1 truncate text-[12px] text-mute dark:text-[#8f8b85]">
                  Ketik nominal… <span className="num font-semibold text-ink dark:text-[#e9e6e2]">Rp 35.000</span>
                </span>
                <span className="hidden sm:inline rounded-full bg-[#f3f1ec] dark:bg-[#2a2a2a] border hairline px-2.5 py-1 text-[11px] font-medium">Makan</span>
                <span className="rounded-full bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] px-3.5 py-1.5 text-[12px] font-semibold shrink-0">Catat</span>
              </div>

              {/* wallets */}
              <div className="grid grid-cols-1 gap-2">
                {wallets.map((w) => (
                  <div key={w.n} className="group flex items-center justify-between rounded-[14px] bg-white dark:bg-[#1d1d1d] border hairline px-3 py-2.5 transition hover:-translate-y-px">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-[10px] grid place-items-center bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] border hairline">
                        <w.icon className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold tracking-tight text-ink dark:text-[#e9e6e2]">{w.n}</div>
                        <div className="text-[11px] text-mute dark:text-[#8f8b85]">{w.t}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline rounded-full border hairline px-1.5 py-0.5 text-[10px] font-medium text-mute dark:text-[#8f8b85] num">{w.trend}</span>
                      <div className="text-[13px] font-semibold num text-ink dark:text-[#e9e6e2]">{w.a}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* insight */}
              <div className="rounded-[14px] bg-[#f3f1ec] dark:bg-[#222] border hairline px-3 py-2.5 flex gap-2.5 items-start">
                <div className="h-8 w-8 rounded-[10px] bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] grid place-items-center shrink-0 border hairline">
                  <Receipt className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[12px] font-semibold text-ink dark:text-[#e9e6e2]">Insight jujur</div>
                    <span className="text-[11px] font-medium underline underline-offset-4 decoration-[#c9c5c0] dark:decoration-[#3a3a3a]">Lihat</span>
                  </div>
                  <div className="text-[12px] text-mute dark:text-[#a7a39d]">Pengeluaran makan naik 32% vs bulan lalu. Gas rem dulu?</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <div className="h-full w-[68%] rounded-full bg-ink dark:bg-[#e9e6e2]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* stamp + caption */}
          <div className="relative">
            <div aria-hidden className="absolute -top-4 right-4 hidden sm:block rotate-3 rounded-lg border-2 border-ink/60 dark:border-[#e9e6e2]/60 px-2.5 py-1 text-[10px] font-bold tracking-[0.22em] opacity-70 bg-paper dark:bg-[#141414]">
              TERCATAT ✓
            </div>
            <div className="flex items-center justify-between pt-3 text-[11px] text-mute dark:text-[#8f8b85]">
              <span>● Live preview — data contoh, bukan data asli</span>
              <span className="num">diperbarui 2 mnt lalu</span>
            </div>
          </div>
        </section>

        <div className="h-px bg-[#e6e3df] dark:bg-[#2a2a2a]" />

        {/* ===== Features ===== */}
        <section className="py-8 sm:py-10">
          <div className="kicker">Kenapa DuitKu</div>
          <h2 className="mt-2 font-display text-[26px] sm:text-[30px] font-[400] tracking-[-0.02em] leading-tight">
            Kecil, tapi <span className="italic">nendang.</span>
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-mute dark:text-[#a7a39d] max-w-[52ch]">
            Semua yang kamu butuhkan buat beresin uang — tanpa fitur numpang lewat yang bikin berat.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {features.map((f) => (
              <Card key={f.title} className="card-hover group relative overflow-hidden">
                <CardContent className="p-5 flex gap-3">
                  <div className="h-9 w-9 rounded-xl grid place-items-center bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] shrink-0 border hairline">
                    <f.icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[14px] font-semibold tracking-tight text-ink dark:text-[#e9e6e2]">{f.title}</div>
                      <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-1 translate-y-1 transition group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0" strokeWidth={1.75} />
                    </div>
                    <div className="text-[13px] leading-relaxed text-mute dark:text-[#a7a39d] mt-1">{f.desc}</div>
                  </div>
                  <span aria-hidden className="absolute right-4 top-3 text-[11px] font-semibold num text-mute/50 dark:text-[#8f8b85]/60">{f.num}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* steps */}
          <div className="mt-8">
            <div className="kicker">Cara kerja</div>
            <div className="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="relative rounded-[18px] border hairline bg-white dark:bg-[#1d1d1d] p-4 transition hover:-translate-y-0.5">
                  <span aria-hidden className="absolute right-3 top-1 font-display text-[34px] font-[300] leading-none text-ink/10 dark:text-white/10 select-none">{s.n}</span>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-paper dark:bg-[#e9e6e2] dark:text-[#141414]">
                    <s.icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div className="mt-3 text-[14px] font-semibold tracking-tight">{s.title}</div>
                  <div className="mt-1 text-[13px] leading-relaxed text-mute dark:text-[#a7a39d]">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* quote */}
          <figure className="mt-6 rounded-[18px] border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d] p-5 sm:p-6">
            <div className="flex items-center gap-0.5 text-ink dark:text-[#e9e6e2]" aria-label="rating 5 dari 5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
              ))}
            </div>
            <blockquote className="mt-3 font-display text-[17px] sm:text-[19px] leading-snug tracking-tight italic">
              “Akhirnya tau ke mana gaji pergi. Ternyata selama ini kalah sama kopi susu.”
            </blockquote>
            <figcaption className="mt-3 flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-paper dark:bg-[#e9e6e2] dark:text-[#141414] text-[10px] font-bold">DN</span>
              <span>
                <span className="block text-[13px] font-semibold leading-none">Dinda N.</span>
                <span className="block text-[12px] text-mute dark:text-[#8f8b85] mt-1">Anak kos · pakai DuitKu 4 bulan</span>
              </span>
            </figcaption>
          </figure>

          {/* CTA */}
          <div className="relative mt-8 rounded-[22px] bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] p-6 sm:p-8 overflow-hidden border hairline">
            <div aria-hidden className="absolute -right-8 -top-12 h-40 w-40 rounded-full border border-dashed border-white/25 dark:border-black/25 animate-spin-slow" />
            <div className="relative flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 dark:border-black/20 px-2.5 py-0.5 text-[11px] font-medium opacity-80">
                  <Zap className="h-3 w-3" strokeWidth={2} /> Mulai dalam 30 detik
                </div>
                <div className="mt-2.5 font-display text-[22px] sm:text-[24px] font-[500] tracking-tight">Siap catat duit hari ini?</div>
                <div className="text-[13px] opacity-70 mt-1">30 detik login Google. Tanpa kartu kredit.</div>
              </div>
              <div className="w-full sm:w-auto shrink-0">
                <Button onClick={() => setLoginOpen(true)} variant="outline" className="group w-full sm:w-auto h-12 px-6 bg-paper dark:bg-[#141414] text-ink dark:text-[#e9e6e2] border hairline hover:bg-white dark:hover:bg-[#1d1d1d]">
                  Masuk ke DuitKu
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={1.75} />
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center text-[11px] text-mute dark:text-[#8f8b85] mt-8">© {new Date().getFullYear()} DuitKu — Next.js 14 · Tailwind · Supabase · warm paper</div>
        </section>
      </main>
    </div>
  );
}
