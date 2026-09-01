"use client";
import * as React from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function toWIBInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(+dt)) return "";
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(dt);
}

function formatDisplay(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(+d)) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type DateInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "defaultValue"> & {
  value: string | Date | null | undefined;
  onValueChange: (value: string) => void;
  withIcon?: boolean;
  /** paksa ke atas (mis. di dalam Dialog yang mepet bawah). Default: auto-flip */
  preferUp?: boolean;
};

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

export function DateInput({ value, onValueChange, className, withIcon = true, preferUp, disabled, id, ...props }: DateInputProps) {
  const str = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : toWIBInputValue(value as any);
  const isEmpty = !str;
  const display = str ? formatDisplay(str) : "";

  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [placeUp, setPlaceUp] = React.useState(false);

  const initialView = React.useMemo(() => {
    if (str) {
      const d = new Date(`${str}T12:00:00`);
      if (!Number.isNaN(+d)) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }, [str]);

  const [view, setView] = React.useState<Date>(initialView);
  React.useEffect(() => {
    if (!open) setView(initialView);
  }, [initialView, open]);

  // auto-flip: kalau space bawah < 360px dan space atas lebih lega → buka ke atas
  // di dalam Dialog transaksi posisi tanggal memang di bawah, jadi default akan ke atas
  React.useEffect(() => {
    if (!open || !wrapRef.current) return;
    if (preferUp !== undefined) { setPlaceUp(preferUp); return; }
    const rect = wrapRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    // butuh ~340px tinggi calendar + margin
    const needUp = spaceBelow < 360 && spaceAbove > spaceBelow;
    setPlaceUp(needUp);
    // kalau di dalam Dialog (ketauan dari dekat bottom viewport < 40% height) bias ke atas
    // fallback: di Dialog memang harus ke atas biar gak ketutup
    const inBottomSheet = rect.top > window.innerHeight * 0.55;
    if (inBottomSheet && spaceBelow < 400) setPlaceUp(true);
  }, [open, preferUp]);

  React.useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const todayISO = React.useMemo(() => toWIBInputValue(new Date()), []);
  const year = view.getFullYear();
  const month = view.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const offset = (firstDow + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function pickDay(day: number) {
    const picked = new Date(year, month, day);
    onValueChange(toISO(picked));
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex h-9 w-full items-center rounded-[14px] border hairline bg-white dark:bg-[#1e1e1e] px-3 py-1 text-left text-[14px] transition-colors focus-visible:outline-none focus-visible:border-ink dark:focus-visible:border-[#3a3a3a] disabled:cursor-not-allowed disabled:opacity-50",
          withIcon ? "pl-[2.55rem]" : "",
          "pr-3",
          isEmpty ? "text-mute dark:text-[#8f8b85]" : "text-ink dark:text-[#e9e6e2] num tabular-nums",
          open && "border-ink dark:border-[#3a3a3a]",
          className
        )}
        {...(props as any)}
      >
        <span className="truncate flex-1">{isEmpty ? "Pilih tanggal" : display}</span>
      </button>

      {withIcon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute dark:text-[#8f8b85]">
          <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
      )}

      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-mute dark:text-[#8f8b85]">
        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && (placeUp ? "-rotate-90" : "rotate-90"))} strokeWidth={1.75} />
      </span>

      {open && (
        <div
          role="dialog"
          aria-label="Pilih tanggal"
          className={cn(
            "absolute left-0 right-0 sm:right-auto sm:w-[304px] z-30 rounded-[18px] border hairline bg-white dark:bg-[#1e1e1e] p-3 fade-in",
            placeUp ? "bottom-full mb-2" : "top-full mt-2"
          )}
          style={{ boxShadow: "none" }}
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setView(new Date(year, month - 1, 1))}
              className="press grid h-8 w-8 place-items-center rounded-full border hairline bg-[#f3f1ec] dark:bg-[#141414] text-ink dark:text-[#e9e6e2] hover:bg-white dark:hover:bg-[#222]"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <div className="text-[13px] font-semibold tracking-tight text-ink dark:text-[#e9e6e2]">
              {MONTHS_ID[month]} <span className="num">{year}</span>
            </div>
            <button
              type="button"
              onClick={() => setView(new Date(year, month + 1, 1))}
              className="press grid h-8 w-8 place-items-center rounded-full border hairline bg-[#f3f1ec] dark:bg-[#141414] text-ink dark:text-[#e9e6e2] hover:bg-white dark:hover:bg-[#222]"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1 text-[11px] font-medium tracking-wide text-mute dark:text-[#8f8b85]">{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={`e-${i}`} className="h-8 w-8" />;
              const iso = toISO(new Date(year, month, d));
              const isSelected = iso === str;
              const isToday = iso === todayISO;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => pickDay(d)}
                  className={cn(
                    "press h-8 w-8 rounded-full text-[13px] num tabular-nums grid place-items-center border border-transparent transition-colors",
                    isSelected
                      ? "bg-ink dark:bg-[#e9e6e2] text-paper dark:text-[#141414] border-ink dark:border-[#e9e6e2]"
                      : "text-ink dark:text-[#e9e6e2] hover:bg-[#f3f1ec] dark:hover:bg-[#222] hover:border-[#e6e3df] dark:hover:border-[#2a2a2a]",
                    !isSelected && isToday && "border-ink dark:border-[#e9e6e2]"
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t hairline pt-3">
            <button
              type="button"
              onClick={() => {
                onValueChange(toWIBInputValue(new Date()));
                setOpen(false);
              }}
              className="press text-[12px] font-medium text-mute dark:text-[#a7a39d] hover:text-ink dark:hover:text-[#e9e6e2] rounded-full border hairline px-3 py-1.5 bg-[#f3f1ec] dark:bg-[#141414]"
            >
              Hari ini
            </button>
            {!isEmpty && (
              <button
                type="button"
                onClick={() => { onValueChange(""); setOpen(false); }}
                className="text-[12px] font-medium text-mute dark:text-[#8f8b85] hover:text-[#b42318] dark:hover:text-[#fca5a5]"
              >
                Hapus
              </button>
            )}
          </div>

          <div className="mt-2 text-center text-[11px] text-mute dark:text-[#8f8b85] num">
            WIB · {str ? formatDisplay(str) : "belum dipilih"}
          </div>
        </div>
      )}
    </div>
  );
}

export { toWIBInputValue };
