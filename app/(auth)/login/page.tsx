"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";
import { ArrowLeft, Wallet, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function LoginPage() {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === "dark";

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
            <CardDescription className="text-mute dark:text-[#a7a39d]">Lanjut dengan Google — atau pakai email &amp; password.</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <LoginForm autoFocus />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
