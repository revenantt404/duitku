"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, KeyRound } from "lucide-react";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) { setMsg("Password minimal 6 karakter."); return; }
    if (pw !== pw2) { setMsg("Konfirmasi password tidak cocok."); return; }
    setLoading(true); setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) setMsg(error.message);
    else { setMsg("Password diperbarui. Mengalihkan ke dashboard…"); setTimeout(() => router.push("/dashboard"), 900); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen grid place-items-center bg-paper dark:bg-[#141414] px-4 py-8">
      <div className="w-full max-w-[420px]">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-mute dark:text-[#a7a39d] hover:text-ink dark:hover:text-[#e9e6e2] mb-4">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Kembali
        </Link>
        <Card className="rounded-[18px] border hairline bg-white dark:bg-[#1d1d1d] overflow-hidden">
          <CardHeader className="text-center pb-3 pt-6">
            <div className="mx-auto h-10 w-10 rounded-xl bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] grid place-items-center border hairline"><KeyRound className="h-5 w-5" strokeWidth={1.75} /></div>
            <CardTitle className="font-display text-[18px] mt-3">Password baru</CardTitle>
            <CardDescription>Link dari email sudah valid — set password baru di sini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <form onSubmit={handle} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="pw">Password baru</Label>
                <Input id="pw" type="password" placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} required className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw2">Konfirmasi</Label>
                <Input id="pw2" type="password" placeholder="••••••••" value={pw2} onChange={(e) => setPw2(e.target.value)} required className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : null}
                Simpan password
              </Button>
            </form>
            {msg && <div className="rounded-[14px] bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] text-[12px] leading-relaxed p-3 border hairline">{msg}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
