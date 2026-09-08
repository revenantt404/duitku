"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { ArrowLeft, KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
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
          <CardContent className="pb-6">
            <ResetPasswordForm autoFocus />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
