"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isPlaceholder = !url || url.includes("placeholder") || url.includes("localhost");
    if (isPlaceholder) { setMsg("Reset password butuh Supabase aktif. Hubungi admin."); return; }
    if (!email) { setMsg("Isi email dulu."); return; }
    setLoading(true); setMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });
    if (error) setMsg(error.message);
    else setMsg("Cek email — link reset dikirim, berlaku 1 jam. Jika tidak ada, cek spam.");
    setLoading(false);
  }

  return (
    <div className="min-h-screen grid place-items-center bg-paper dark:bg-[#141414] px-4 py-8">
      <div className="w-full max-w-[420px]">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-mute dark:text-[#a7a39d] hover:text-ink dark:hover:text-[#e9e6e2] mb-4">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Kembali ke login
        </Link>
        <Card className="rounded-[18px] border hairline bg-white dark:bg-[#1d1d1d] overflow-hidden">
          <CardHeader className="text-center pb-3 pt-6">
            <div className="mx-auto h-10 w-10 rounded-xl bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] grid place-items-center border hairline"><KeyRound className="h-5 w-5" strokeWidth={1.75} /></div>
            <CardTitle className="font-display text-[18px] mt-3">Lupa password</CardTitle>
            <CardDescription>Masukin email — kami kirim link reset.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <form onSubmit={handle} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="kamu@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : null}
                Kirim link reset
              </Button>
            </form>
            {msg && <div className="rounded-[14px] bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] text-[12px] leading-relaxed p-3 border hairline">{msg}</div>}
            <div className="text-center text-[12px] text-mute dark:text-[#8f8b85]">Ingat password? <Link href="/login" className="font-medium text-ink dark:text-[#e9e6e2] hover:underline underline-offset-4">Masuk</Link></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
