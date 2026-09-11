"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** "sheet" = bottom-sheet di mobile (default, perilaku lama) · "center" = modal tengah di semua ukuran */
  position?: "sheet" | "center";
  /** backdrop blur + redup biar halaman bawah gak ngedistract (dipakai login) */
  dim?: boolean;
}
export function Dialog({ open, onOpenChange, children, position = "sheet", dim = false }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);
  if (!open) return null;
  const centered = position === "center";
  return (
    <div
      className={
        centered
          ? "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          : "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      }
      role="presentation"
    >
      <div
        className={
          dim
            ? "fixed inset-0 bg-black/45 dark:bg-black/70 backdrop-blur-md backdrop-saturate-150 fade-in"
            : "fixed inset-0 bg-[rgba(0,0,0,0.32)] dark:bg-black/60 fade-in"
        }
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div
        className={
          centered
            ? "relative z-50 w-full sm:max-w-[440px] max-h-[92dvh] sm:max-h-[90vh] overflow-auto overscroll-contain scale-in"
            : "relative z-50 w-full sm:max-w-[440px] max-h-[92dvh] sm:max-h-[90vh] overflow-auto overscroll-contain sm:scale-in sheet-in sm:sheet-in-none"
        }
      >
        {children}
      </div>
    </div>
  );
}
export function DialogContent({ className, children, onClose, grabber = true }: { className?: string; children: React.ReactNode; onClose?: () => void; grabber?: boolean }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "relative bg-white dark:bg-[#1d1d1d] border hairline w-full min-w-0 break-words p-6 pb-[max(20px,env(safe-area-inset-bottom))] sm:pb-6 rounded-t-[20px] sm:rounded-[18px] shadow-sm",
        className
      )}
    >
      {grabber && <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[#e6e3df] dark:bg-[#2a2a2a] sm:hidden" aria-hidden />}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-3 h-11 w-11 sm:h-8 sm:w-8 grid place-items-center rounded-full border hairline bg-[#f3f1ec] dark:bg-[#222] hover:bg-[#ecebe8] dark:hover:bg-[#2a2a2a] active:opacity-80 transition-colors"
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
  return <div className={cn("flex flex-col space-y-1 text-left mb-4 pr-8 min-w-0 break-words", className)} {...props} />;
}
export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("font-display text-[17px] font-[500] leading-none tracking-tight text-ink dark:text-[#e9e6e2] min-w-0 break-words", className)} {...props} />;
}
export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-[12px] leading-relaxed text-mute dark:text-[#a7a39d] min-w-0 break-words", className)} {...props} />;
}
export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-5", className)} {...props} />;
}
