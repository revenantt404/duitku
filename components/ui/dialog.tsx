"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode; }
export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-[rgba(0,0,0,0.32)] dark:bg-black/60 fade-in" onClick={() => onOpenChange(false)} aria-hidden />
      <div className="relative z-50 w-full sm:max-w-[440px] max-h-[92dvh] sm:max-h-[90vh] overflow-auto overscroll-contain scale-in">
        {children}
      </div>
    </div>
  );
}
export function DialogContent({ className, children, onClose }: { className?: string; children: React.ReactNode; onClose?: () => void }) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-[#1d1d1d] border hairline w-full p-6 pb-[max(20px,env(safe-area-inset-bottom))] sm:pb-6 rounded-t-[18px] sm:rounded-[18px]",
        className
      )}
    >
      <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[#e6e3df] dark:bg-[#2a2a2a] sm:hidden" aria-hidden />
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-3 h-10 w-10 sm:h-8 sm:w-8 grid place-items-center rounded-full border hairline bg-[#f3f1ec] dark:bg-[#222] hover:bg-[#ecebe8] dark:hover:bg-[#2a2a2a] active:opacity-80 transition-colors"
          aria-label="Tutup"
        >
          <X className="h-4 w-4 text-mute dark:text-[#a7a39d]" />
        </button>
      )}
      {children}
    </div>
  );
}
export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1 text-left mb-4 pr-8", className)} {...props} />;
}
export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("font-display text-[17px] font-[500] leading-none tracking-tight text-ink dark:text-[#e9e6e2]", className)} {...props} />;
}
export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-[12px] leading-relaxed text-mute dark:text-[#a7a39d]", className)} {...props} />;
}
export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-5", className)} {...props} />;
}
