"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Wallet, Moon, Sun, Mail } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [msg, setMsg] = useState<string | null>(null);
  const { resolved, toggle } = useTheme();
  const isDark = resolved === "dark";

  const supabase = createClient();
  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "placeholder" ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("localhost");

  async function handleGoogle() {
    if (isPlaceholder) {
      setMsg("Mode Demo aktif — Google butuh Supabase. Pakai 'Kirim link login' atau 'Masuk Demo' di bawah, atau hubungkan Supabase dulu (lihat SETUP.md). Google bisa nyusul nanti.");
      return;
    }
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setMsg(error.message);
    setLoading(false);
  }

  async function handleMagic(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setMsg("Isi email dulu."); return; }
    if (isPlaceholder) {
      localStorage.setItem("duitku_demo_user", JSON.stringify({ email, name: "Demo User" }));
      router.push("/dashboard");
      return;
    }
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setMsg(error.message);
    else setMsg("Cek email — link login dikirim. Klik link di inbox (cek spam juga). Link cuma 1x pakai.");
    setLoading(false);
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (isPlaceholder) {
      localStorage.setItem("duitku_demo_user", JSON.stringify({ email: email || "demo@duitku.local", name: "Demo User" }));
      router.push("/dashboard");
      return;
    }
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
    else router.push("/dashboard");
    setLoading(false);
  }

  async function handleSignup() {
    if (isPlaceholder) {
      localStorage.setItem("duitku_demo_user", JSON.stringify({ email: email || "demo@duitku.local", name: "Demo User" }));
      router.push("/dashboard");
      return;
    }
    if (!email || !password) { setMsg("Isi email & password buat daftar."); return; }
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setMsg(error.message);
    else setMsg("Akun dibuat. Cek email buat verifikasi, atau langsung login kalau verifikasi dimatikan di Supabase.");
    setLoading(false);
  }

  async function handleDemo() {
    localStorage.setItem("duitku_demo_user", JSON.stringify({ email: "demo@duitku.local", name: "Demo User" }));
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen grid place-items-center bg-paper dark:bg-[#141414] px-4 py-8">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-mute dark:text-[#a7a39d] hover:text-ink dark:hover:text-[#e9e6e2]">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Kembali
          </Link>
          <button
            onClick={toggle}
            aria-label={isDark ? "Mode terang" : "Mode gelap"}
            className="h-9 w-9 grid place-items-center rounded-full bg-white dark:bg-[#1d1d1d] border hairline text-mute dark:text-[#a7a39d]"
          >
            {isDark ? <Sun className="h-4 w-4" strokeWidth={1.75} /> : <Moon className="h-4 w-4" strokeWidth={1.75} />}
          </button>
        </div>
        <Card className="rounded-[18px] border hairline bg-white dark:bg-[#1d1d1d] overflow-hidden">
          <div className="h-10 flex items-center px-4 bg-[#f3f1ec] dark:bg-[#222] border-b hairline">
            <span className="text-[12px] font-medium text-mute dark:text-[#a7a39d]">DuitKu — Masuk</span>
            <span className="ml-auto text-[11px] text-mute dark:text-[#8f8b85] border hairline rounded-full px-2 py-0.5 bg-white dark:bg-[#1d1d1d]">warm</span>
          </div>
          <CardHeader className="text-center pb-3 pt-6">
            <div className="mx-auto h-10 w-10 rounded-xl bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] grid place-items-center border hairline"><Wallet className="h-5 w-5" strokeWidth={1.75} /></div>
            <CardTitle className="font-display text-[18px] mt-3 text-ink dark:text-[#e9e6e2]">Masuk ke DuitKu</CardTitle>
            <CardDescription className="text-mute dark:text-[#a7a39d]">Paling gampang: pakai link email. Tanpa Google, tanpa ribet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            {isPlaceholder && (
              <div className="rounded-[14px] border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d] p-3">
                <div className="text-[11px] font-semibold tracking-widest text-mute dark:text-[#8f8b85] uppercase">Mode Demo — langsung coba</div>
                <div className="text-[12px] leading-relaxed text-mute dark:text-[#a7a39d] mt-1">Belum hubung Supabase? Gak apa — data disimpan di HP/browser. Isi email asal & klik <span className="font-medium text-ink dark:text-[#e9e6e2]">Kirim link / Masuk</span> bakal langsung masuk. Buat data beneran per akun, ikutin 2 langkah di <code className="bg-white dark:bg-[#141414] border hairline rounded px-1 py-0.5 text-ink dark:text-[#e9e6e2]">SETUP.md</code>.</div>
              </div>
            )}

            {/* Google — opsional, tetap ada tapi jelas "bisa skip" */}
            <Button onClick={handleGoogle} variant="outline" className="w-full h-10 text-[13px]" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <span className="h-5 w-5 rounded-full bg-white dark:bg-[#1d1d1d] border hairline grid place-items-center text-[8px] font-bold text-ink dark:text-[#e9e6e2]">G</span>}
              Lanjut dengan Google <span className="ml-1 text-[11px] text-mute dark:text-[#8f8b85] font-normal">· opsional, bisa skip</span>
            </Button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t hairline" /></div>
              <div className="relative flex justify-center"><span className="bg-white dark:bg-[#1d1d1d] px-2 text-[12px] text-mute dark:text-[#8f8b85]">paling gampang ↓</span></div>
            </div>

            {/* Pill toggle magic vs password */}
            <div className="flex justify-center">
              <div className="inline-flex gap-1 rounded-full bg-[#f3f1ec] dark:bg-[#1d1d1d] p-1 border hairline">
                <button type="button" onClick={() => setMode("magic")} className={`press rounded-full px-3.5 py-1.5 text-xs font-medium ${mode === "magic" ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414]" : "text-mute dark:text-[#8f8b85]"}`}>Link email</button>
                <button type="button" onClick={() => setMode("password")} className={`press rounded-full px-3.5 py-1.5 text-xs font-medium ${mode === "password" ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414]" : "text-mute dark:text-[#8f8b85]"}`}>Password</button>
              </div>
            </div>

            {mode === "magic" ? (
              <form onSubmit={handleMagic} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email-magic">Email</Label>
                  <Input id="email-magic" type="email" placeholder="kamu@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <p className="text-[11px] text-mute dark:text-[#8f8b85]">Tanpa password — nanti klik link di email buat masuk. {isPlaceholder && "Di Demo, langsung masuk tanpa email beneran."}</p>
                </div>
                <Button type="submit" className="w-full h-10" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <Mail className="h-4 w-4" strokeWidth={1.75} />}
                  {isPlaceholder ? "Masuk Demo" : "Kirim link login"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePasswordLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="kamu@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required={!isPlaceholder} />
                  {isPlaceholder && <p className="text-[12px] text-mute dark:text-[#8f8b85]">Mode demo — password bebas.</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="submit" className="h-10" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : null}
                    {isPlaceholder ? "Masuk Demo" : "Masuk"}
                  </Button>
                  <Button type="button" variant="outline" className="h-10" onClick={handleSignup} disabled={loading}>Daftar</Button>
                </div>
              </form>
            )}

            {isPlaceholder && (
              <Button variant="secondary" size="sm" className="w-full h-9" onClick={handleDemo}>Buka Dashboard Demo Tanpa Login</Button>
            )}

            {msg && <div className="rounded-[14px] bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] text-[12px] leading-relaxed p-3 border hairline">{msg}</div>}

            <div className="text-center text-[12px] leading-relaxed text-mute dark:text-[#8f8b85]">
              Mau data per akun beneran? Cukup <span className="font-medium text-ink dark:text-[#e9e6e2]">2 langkah</span> — lihat <code className="bg-[#f3f1ec] dark:bg-[#222] border hairline rounded px-1 py-0.5 text-ink dark:text-[#e9e6e2]">SETUP.md</code>. Google login bisa nyusul kapan aja.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
