"use client";
import { useEffect, useState } from "react";
import { KeyRound, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoginForm } from "@/components/login-form";
import { ResetPasswordForm } from "@/components/reset-password-form";

type View = "login" | "reset";

export function LoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [view, setView] = useState<View>("login");

  // tiap modal dibuka, mulai dari login lagi
  useEffect(() => {
    if (open) setView("login");
  }, [open]);

  const isReset = view === "reset";

  return (
    <Dialog open={open} onOpenChange={onOpenChange} position="center" dim>
      <DialogContent onClose={() => onOpenChange(false)} grabber={false} className="max-w-[420px] p-0 overflow-hidden rounded-[20px] sm:rounded-[20px]">
        <div className="h-10 flex items-center pl-4 pr-14 bg-[#f3f1ec] dark:bg-[#222] border-b hairline">
          <span className="text-[12px] font-medium text-mute dark:text-[#a7a39d]">DuitKu — {isReset ? "Lupa password" : "Masuk"}</span>
        </div>
        <div className="p-6 pt-5">
          <div key={view} className={isReset ? "auth-in-right" : "auth-in-left"}>
            <DialogHeader className="text-center items-center mb-4 pr-0">
              <div className="mx-auto h-10 w-10 rounded-xl bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] grid place-items-center border hairline">
                {isReset
                  ? <KeyRound className="h-5 w-5" strokeWidth={1.75} />
                  : <Wallet className="h-5 w-5" strokeWidth={1.75} />}
              </div>
              <DialogTitle className="text-center text-[18px] mt-3">
                {isReset ? "Lupa password" : "Masuk ke DuitKu"}
              </DialogTitle>
              <DialogDescription className="text-center">
                {isReset ? "Masukin email — kami kirim link reset." : <>Lanjut dengan Google — atau pakai email &amp; password.</>}
              </DialogDescription>
            </DialogHeader>
            {isReset ? (
              <ResetPasswordForm autoFocus onBack={() => setView("login")} />
            ) : (
              <LoginForm autoFocus onSuccess={() => onOpenChange(false)} onForgot={() => setView("reset")} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
