"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function ResetPasswordForm({ autoFocus = false, onBack }: { autoFocus?: boolean; onBack?: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isPlaceholder = !url || url.includes("placeholder") || url.includes("localhost");
    if (isPlaceholder) { setMsg("Reset password lagi nggak bisa. Coba lagi nanti atau hubungi admin."); return; }
    if (!email) { setMsg("Isi email dulu."); return; }
    setLoading(true); setMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });
    if (error) setMsg(error.message);
    else setMsg("Cek email — link reset udah dikirim, berlaku 1 jam. Kalau nggak ada, coba cek folder spam.");
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handle} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="reset-email">Email</Label>
          <Input id="reset-email" type="email" placeholder="kamu@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus={autoFocus} required className="h-11" />
        </div>
        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : null}
          Kirim link reset
        </Button>
      </form>

      {msg && <div className="rounded-[14px] bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] text-[12px] leading-relaxed p-3 border hairline">{msg}</div>}

      <div className="text-center text-[12px] text-mute dark:text-[#8f8b85]">
        Ingat password?{" "}
        {onBack ? (
          <button type="button" onClick={onBack} className="font-medium text-ink dark:text-[#e9e6e2] hover:underline underline-offset-4">Masuk</button>
        ) : (
          <Link href="/login" className="font-medium text-ink dark:text-[#e9e6e2] hover:underline underline-offset-4">Masuk</Link>
        )}
      </div>
    </div>
  );
}
