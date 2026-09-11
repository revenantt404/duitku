"use client";
import { createContext, useContext, useCallback, useState, useRef, useEffect } from "react";

type Toast = {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration: number;
};

type ToastCtx = {
  toast: (msg: string) => void;
  toastUndo: (msg: string, onUndo: () => void, duration?: number) => void;
};

const Ctx = createContext<ToastCtx>({ toast() {}, toastUndo() {} });

export function useToast() {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const timers = useRef<Map<string, number>>(new Map());

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    setLeaving((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    const tm = timers.current.get(id);
    if (tm) { window.clearTimeout(tm); timers.current.delete(id); }
  }, []);

  // keluarnya fade-out dulu (±220ms, ikut .toast-out) baru beneran dihapus
  const dismiss = useCallback((id: string) => {
    const prev = timers.current.get(id);
    if (prev) window.clearTimeout(prev);
    setLeaving((prevSet) => (prevSet.has(id) ? prevSet : new Set(prevSet).add(id)));
    const tm = window.setTimeout(() => remove(id), 230);
    timers.current.set(id, tm as unknown as number);
  }, [remove]);

  const push = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
    const tm = window.setTimeout(() => dismiss(toast.id), toast.duration);
    timers.current.set(toast.id, tm as unknown as number);
  }, [dismiss]);

  const toast = useCallback((message: string) => {
    push({ id: String(Date.now() + Math.random()), message, duration: 2500 });
  }, [push]);

  const toastUndo = useCallback((message: string, onUndo: () => void, duration = 10000) => {
    const id = String(Date.now() + Math.random());
    push({
      id,
      message,
      actionLabel: "Urungkan",
      duration,
      onAction: () => {
        onUndo();
        dismiss(id);
      },
    });
  }, [push, dismiss]);

  // cleanup on unmount
  useEffect(() => () => {
    timers.current.forEach((tm) => window.clearTimeout(tm));
  }, []);

  return (
    <Ctx.Provider value={{ toast, toastUndo }}>
      {children}
      {/* viewport — bottom-6 centered, hairline only, flat murni */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-6 max-sm:bottom-24 z-[10000] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex max-w-[min(92vw,420px)] items-center gap-3 rounded-[14px] border hairline bg-white dark:bg-[#1d1d1d] px-4 py-3 text-[13px] leading-snug text-ink dark:text-[#e9e6e2] ${leaving.has(t.id) ? "toast-out" : "toast-in"}`}
            style={{ boxShadow: "none" }}
          >
            <span className="flex-1">{t.message}</span>
            {t.actionLabel && t.onAction && (
              <button
                type="button"
                onClick={t.onAction}
                className="press shrink-0 rounded-full border hairline bg-[#f3f1ec] dark:bg-[#222] px-3 py-1 text-[12px] font-medium tracking-tight hover:bg-white dark:hover:bg-[#2a2a2a] transition-colors"
              >
                {t.actionLabel}
              </button>
            )}
            <button
              type="button"
              aria-label="Tutup"
              onClick={() => dismiss(t.id)}
              className="shrink-0 grid place-items-center text-mute dark:text-[#8f8b85] hover:text-ink dark:hover:text-[#e9e6e2] px-1 max-sm:min-h-[44px] max-sm:min-w-[44px] max-sm:px-0"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
