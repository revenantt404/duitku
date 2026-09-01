import Link from "next/link";
import { ArrowRight, Wallet, PieChart, Target, ShieldCheck, Smartphone, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper dark:bg-[#141414] text-ink dark:text-[#e9e6e2]">
      <header className="max-w-[720px] mx-auto px-6 md:px-0 pt-10 md:pt-16 pb-8 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="h-8 w-8 rounded-full bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] grid place-items-center text-[10px] font-bold">Rp</span>
          <span className="text-[18px] font-[500] tracking-tight">duitku.</span>
          <span className="hidden sm:inline text-[11px] text-mute dark:text-[#8f8b85] border hairline rounded-full px-2 py-0.5">warm</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:inline text-[13px] font-medium text-mute dark:text-[#a7a39d] hover:text-ink dark:hover:text-[#e9e6e2] px-3 py-2">Masuk</Link>
          <Link href="/login"><Button size="sm">Mulai <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} /></Button></Link>
        </div>
      </header>

      <main className="max-w-[720px] mx-auto px-6 md:px-0 pb-24">
        {/* Hero */}
        <section className="border-t hairline pt-10 sm:pt-14 pb-10">
          <div className="inline-flex items-center gap-2 text-[12px] font-medium text-mute dark:text-[#a7a39d] bg-[#f3f1ec] dark:bg-[#1d1d1d] border hairline px-3 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-ink dark:bg-[#e9e6e2]" /> Website — bukan aplikasi install
          </div>
          <h1 className="mt-4 font-display text-[36px] sm:text-[52px] font-[300] tracking-[-0.03em] leading-[1.02] text-ink dark:text-[#e9e6e2]">
            Catat duit, <span className="italic font-[300]">jelas hidup.</span>
          </h1>
          <p className="mt-3 text-[15px] leading-[1.72] text-mute dark:text-[#a7a39d] max-w-[48ch]">
            DuitKu — 10 detik per transaksi. Multi-dompet, budgeting, grafik jujur. Warm paper, tegas, tanpa distraksi.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link href="/login" className="w-full sm:w-auto"><Button className="w-full sm:w-auto h-11 px-6 text-[14px]">Lanjut — Gratis <ArrowRight className="h-4 w-4" strokeWidth={1.75} /></Button></Link>
            <Link href="/dashboard" className="w-full sm:w-auto"><Button variant="outline" className="w-full sm:w-auto h-11 px-6">Lihat Demo</Button></Link>
          </div>
          <p className="mt-3 text-[12px] text-mute dark:text-[#8f8b85]">Google login · RLS per user · Vercel</p>

          <div className="mt-8 grid grid-cols-3 gap-3 text-left">
            {[
              { k: "Multi-dompet", v: "Cash / Bank / eWallet dipisah" },
              { k: "< 10 detik", v: "Input 1 transaksi" },
              { k: "IDR aman", v: "BigInt, bukan Float" },
            ].map((s) => (
              <div key={s.k} className="rounded-[18px] bg-white dark:bg-[#1d1d1d] border hairline px-3 py-3">
                <div className="text-[11px] font-medium tracking-wide text-mute dark:text-[#8f8b85]">{s.k}</div>
                <div className="text-[13px] font-semibold tracking-tight mt-1 text-ink dark:text-[#e9e6e2]">{s.v}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Window mockup */}
        <section className="pb-10">
          <div className="rounded-[18px] bg-white dark:bg-[#1d1d1d] border hairline overflow-hidden">
            <div className="h-10 flex items-center justify-between px-4 bg-[#f3f1ec] dark:bg-[#222] border-b hairline">
              <span className="text-[12px] font-medium text-mute dark:text-[#a7a39d]">DuitKu — Dashboard</span>
              <span className="text-[11px] text-mute dark:text-[#8f8b85] border hairline rounded-full px-2 py-0.5 bg-white dark:bg-[#1d1d1d]">preview</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="rounded-[18px] bg-[#f3f1ec] dark:bg-[#1d1d1d] border hairline p-4">
                <div className="text-[11px] font-medium tracking-wide text-mute dark:text-[#8f8b85] uppercase">Total Saldo</div>
                <div className="mt-1 text-[24px] font-semibold tracking-tight num text-ink dark:text-[#e9e6e2]">Rp 12.450.000</div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-[11px] border-t hairline pt-3">
                  <div><div className="tracking-wide text-mute dark:text-[#8f8b85]">MASUK</div><div className="font-semibold mt-0.5 num text-ink dark:text-[#e9e6e2]">Rp 8,2 jt</div></div>
                  <div className="border-l hairline pl-3"><div className="tracking-wide text-mute dark:text-[#8f8b85]">KELUAR</div><div className="font-semibold mt-0.5 num text-ink dark:text-[#e9e6e2]">Rp 3,78 jt</div></div>
                  <div className="border-l hairline pl-3"><div className="tracking-wide text-mute dark:text-[#8f8b85]">SISA</div><div className="font-semibold mt-0.5 num text-ink dark:text-[#e9e6e2]">Rp 4,42 jt</div></div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { n: "BCA", t: "BANK", a: "Rp 8.100.000" },
                  { n: "Cash", t: "CASH", a: "Rp 2.350.000" },
                  { n: "GoPay", t: "E-WALLET", a: "Rp 500.000" },
                ].map((w) => (
                  <div key={w.n} className="flex items-center justify-between rounded-[14px] bg-white dark:bg-[#1d1d1d] border hairline px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-[10px] grid place-items-center bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] border hairline"><Wallet className="h-4 w-4" strokeWidth={1.75} /></div>
                      <div><div className="text-[13px] font-semibold tracking-tight text-ink dark:text-[#e9e6e2]">{w.n}</div><div className="text-[11px] text-mute dark:text-[#8f8b85]">{w.t}</div></div>
                    </div>
                    <div className="text-[13px] font-semibold num text-ink dark:text-[#e9e6e2]">{w.a}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-[14px] bg-[#f3f1ec] dark:bg-[#1d1d1d] border hairline px-3 py-2.5 flex gap-2.5">
                <div className="h-8 w-8 rounded-[10px] bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] grid place-items-center shrink-0 border hairline"><TrendingUp className="h-4 w-4" strokeWidth={1.75} /></div>
                <div><div className="text-[12px] font-semibold text-ink dark:text-[#e9e6e2]">Insight</div><div className="text-[12px] text-mute dark:text-[#a7a39d]">Pengeluaran makan naik 32% vs bulan lalu.</div></div>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-[#e6e3df] dark:bg-[#2a2a2a]" />

        <section className="py-8 sm:py-10">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Wallet, title: "Multi-dompet rapi", desc: "Cash, BCA, GoPay, investasi dipisah. Transfer tidak merusak laporan." },
              { icon: PieChart, title: "Grafik jujur", desc: "Donut per kategori + bar 6 bulan. Warm, langsung keliatan borosnya." },
              { icon: Target, title: "Budget & goals", desc: "Limit makan 1,5jt/bulan. Nabung iPhone progress 40%." },
              { icon: ShieldCheck, title: "Data aman", desc: "BigInt Rupiah, soft-delete, RLS per user. Minus boleh, tapi keliatan." },
              { icon: Smartphone, title: "Input 10 detik", desc: "FAB → nominal → kategori → dompet → simpan. Tanpa distraksi." },
              { icon: TrendingUp, title: "Gratis di Vercel", desc: "Next.js + Supabase + Prisma. Deploy ke duitku.vercel.app." },
            ].map((f) => (
              <Card key={f.title} className="card-hover">
                <CardContent className="p-5 flex gap-3">
                  <div className="h-9 w-9 rounded-xl grid place-items-center bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] shrink-0 border hairline"><f.icon className="h-4 w-4" strokeWidth={1.75} /></div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold tracking-tight text-ink dark:text-[#e9e6e2]">{f.title}</div>
                    <div className="text-[13px] leading-relaxed text-mute dark:text-[#a7a39d] mt-1">{f.desc}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 rounded-[18px] bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] p-6 sm:p-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border hairline">
            <div>
              <div className="font-display text-[18px] font-[500] tracking-tight">Siap catat duit hari ini?</div>
              <div className="text-[13px] opacity-70 mt-1">30 detik login Google. Tanpa kartu kredit.</div>
            </div>
            <Link href="/login" className="w-full sm:w-auto"><Button variant="outline" className="w-full sm:w-auto bg-paper dark:bg-[#141414] text-ink dark:text-[#e9e6e2] border hairline hover:bg-white dark:hover:bg-[#1d1d1d]">Masuk ke DuitKu <ArrowRight className="h-4 w-4" strokeWidth={1.75} /></Button></Link>
          </div>

          <div className="text-center text-[11px] text-mute dark:text-[#8f8b85] mt-8">© {new Date().getFullYear()} DuitKu — Next.js 14 · Tailwind · Supabase · warm paper</div>
        </section>
      </main>
    </div>
  );
}
