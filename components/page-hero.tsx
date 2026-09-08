import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ===== Motif editorial landing — reusable pasca-login =====
   Pill ink miring + italic + squiggle + koin orbit.
   Token strict: paper/ink/hairline, dark #141414/#e9e6e2. Lebar ikut parent (720px). */

export function HeroPill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex -rotate-2 items-center rounded-[14px] bg-ink px-3 py-0.5 font-[500] text-paper shadow-sm dark:bg-[#e9e6e2] dark:text-[#141414] sm:rounded-[16px] sm:px-4 sm:py-1",
        className
      )}
    >
      {children}
    </span>
  );
}

export function HeroItalic({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("relative inline-block font-[500] italic", className)}>
      {children}
      <svg
        className="absolute -bottom-1.5 left-0 w-full text-ink dark:text-[#e9e6e2] sm:-bottom-2"
        viewBox="0 0 220 12"
        fill="none"
        aria-hidden
      >
        <path
          className="squiggle-path"
          pathLength={1}
          d="M3 9C40 2 80 11 115 6s75-3 102 1"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function HeroCoin({
  label = "Rp",
  compact = false,
  className,
}: {
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("relative ml-1 inline-flex -translate-y-1 align-middle text-ink dark:text-[#e9e6e2]", className)}
      aria-hidden
      title={label}
    >
      <span className="animate-spin-slow absolute -inset-2">
        <svg viewBox="0 0 48 48" className="h-full w-full" fill="none">
          <circle cx="24" cy="24" r="21" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="3 6" strokeLinecap="round" />
        </svg>
      </span>
      <span
        className={cn(
          "grid rotate-6 place-items-center rounded-full bg-ink text-paper shadow-sm dark:bg-[#e9e6e2] dark:text-[#141414]",
          compact ? "h-9 w-9 sm:h-10 sm:w-10" : "h-10 w-10 sm:h-12 sm:w-12"
        )}
      >
        <span className="text-[11px] font-bold tracking-tight sm:text-[12px]">{label}</span>
      </span>
    </span>
  );
}

/* ===== Hero-art unik per halaman — satu halaman satu art, tidak sama dengan home =====
   Semua inline dalam baris judul (tidak absolute menutupi teks), token strict
   paper/ink/hairline, flat tanpa gradient/blur. Dashboard pakai HeroCoin. */

/* ===== Treatment tipografi unik per halaman =====
   Bukan sekadar ikon beda — gaya tulisannya sendiri beda karakter.
   Semua inline, tidak absolute menutupi teks. */

/* Transaksi — cap arsip mono uppercase */
export function HeroStamp({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block -rotate-1 rounded-[8px] border-2 border-ink px-2.5 py-0.5 font-mono text-[0.62em] font-bold uppercase leading-none tracking-[0.18em] text-ink dark:border-[#e9e6e2] dark:text-[#e9e6e2]",
        className
      )}
    >
      {children}
    </span>
  );
}

/* Transaksi — underline tebal lurus (bukan squiggle) */
export function HeroRule({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("relative inline-block font-[600]", className)}>
      {children}
      <span className="absolute -bottom-1 left-0 h-[5px] w-full -rotate-[0.5deg] rounded-full bg-ink dark:bg-[#e9e6e2] sm:-bottom-1.5" aria-hidden />
    </span>
  );
}

/* Dompet — kata outline raksasa (stroke, tengah transparan) */
export function HeroOutline({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn("inline-block font-[700] uppercase leading-none tracking-[-0.01em] text-transparent", className)}
      style={{ WebkitTextStroke: "2px var(--duitku-outline, #1a1a1a)" }}
      aria-label={typeof children === "string" ? children : undefined}
    >
      {children}
    </span>
  );
}

/* Anggaran — papan rambu: bar kecil mono uppercase */
export function HeroSign({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-[6px] bg-[#b42318] px-2.5 py-1 font-mono text-[0.5em] font-bold uppercase leading-none tracking-[0.22em] text-white dark:bg-[#fca5a5] dark:text-[#141414]",
        className
      )}
    >
      {children}
    </span>
  );
}

/* Anggaran — kata raksasa italic miring tegas */
export function HeroShout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-block -rotate-1 font-[700] italic leading-[0.95] tracking-[-0.03em]", className)}>
      {children}
    </span>
  );
}

/* Kategori — chip label rak per kata */
export function HeroChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rotate-1 rounded-[10px] border hairline bg-white px-2.5 py-0.5 font-mono text-[0.72em] font-medium shadow-sm dark:bg-[#1d1d1d]",
        className
      )}
    >
      {children}
    </span>
  );
}

/* Kategori — kata dilingkari spidol (ellipse hand-drawn) */
export function HeroCircle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("relative inline-block whitespace-nowrap px-2 font-[600]", className)}>
      {children}
      <svg
        className="absolute -inset-x-1 -inset-y-1.5 h-[calc(100%+12px)] w-[calc(100%+8px)] text-ink dark:text-[#e9e6e2]"
        viewBox="0 0 120 44"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden
      >
        <ellipse
          className="squiggle-path"
          pathLength={1}
          cx="60"
          cy="22"
          rx="55"
          ry="17"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform="rotate(-2 60 22)"
        />
      </svg>
    </span>
  );
}

/* Tujuan — kata menanjak (tiap kata naik 1 anak tangga) */
export function HeroRise({ words, className }: { words: [string, ...string[]]; className?: string }) {
  return (
    <span className={cn("inline-flex flex-wrap items-end gap-x-2.5", className)}>
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          className="font-[600] leading-[1.05]"
          style={i > 0 ? { transform: `translateY(-${i * 7}px)` } : undefined}
        >
          {w}
        </span>
      ))}
    </span>
  );
}

export function HeroLedger({ className }: { className?: string }) {
  return (
    <span className={cn("relative ml-1 inline-flex -translate-y-1 align-middle", className)} aria-hidden>
      <span className="flex h-9 w-11 rotate-2 flex-col justify-center gap-[5px] rounded-[10px] border hairline bg-white px-2 shadow-sm dark:bg-[#1d1d1d] sm:h-10 sm:w-12">
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-1 shrink-0 rounded-full bg-[#1a7a4a] dark:bg-[#4ade80]" />
          <span className="h-[3px] w-6 rounded-full bg-ink/70 dark:bg-[#e9e6e2]/70" />
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-1 shrink-0 rounded-full bg-[#b42318] dark:bg-[#fca5a5]" />
          <span className="h-[3px] w-4 rounded-full bg-ink/40 dark:bg-[#e9e6e2]/40" />
        </span>
        <span className="ml-[10px] h-[3px] w-5 rounded-full bg-ink/20 dark:bg-[#e9e6e2]/20" />
      </span>
    </span>
  );
}

export function HeroStack({ className }: { className?: string }) {
  return (
    <span className={cn("relative ml-1 inline-flex h-9 w-11 -translate-y-1 align-middle sm:h-10 sm:w-12", className)} aria-hidden>
      <span className="absolute inset-x-1.5 top-0 h-7 rotate-6 rounded-[10px] border hairline bg-[#f3f1ec] dark:bg-[#2a2a2a] sm:h-8" />
      <span className="absolute inset-x-0 bottom-0 h-7 -rotate-2 rounded-[10px] border hairline bg-ink shadow-sm dark:bg-[#e9e6e2] sm:h-8" />
      <span className="absolute bottom-[9px] left-2.5 h-[3px] w-4 rounded-full bg-paper/80 dark:bg-[#141414]/70" />
      <span className="absolute bottom-[8px] right-2.5 h-1.5 w-1.5 rounded-full border border-paper/80 dark:border-[#141414]/70" />
    </span>
  );
}

export function HeroGauge({ className }: { className?: string }) {
  return (
    <span className={cn("relative ml-1 inline-flex -translate-y-1 align-middle text-ink dark:text-[#e9e6e2]", className)} aria-hidden>
      <span className="grid h-9 w-11 place-items-center overflow-hidden rounded-[10px] border hairline bg-white shadow-sm dark:bg-[#1d1d1d] sm:h-10 sm:w-12">
        <svg viewBox="0 0 44 30" className="h-7 w-9 sm:h-8 sm:w-10" fill="none">
          <path d="M5 25A17 17 0 0 1 39 25" stroke="currentColor" strokeOpacity="0.22" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M5 25A17 17 0 0 1 29.7 9.9" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M22 25 30.5 12.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="22" cy="25" r="2.6" fill="currentColor" />
        </svg>
      </span>
    </span>
  );
}

export function HeroDots({ className }: { className?: string }) {
  return (
    <span className={cn("relative ml-1 inline-flex -translate-y-1 items-center gap-1.5 rounded-full border hairline bg-white px-3 py-2.5 shadow-sm -rotate-2 dark:bg-[#1d1d1d] sm:py-3", className)} aria-hidden>
      <span className="h-2 w-2 rounded-full bg-ink dark:bg-[#e9e6e2]" />
      <span className="h-2 w-2 rounded-full bg-ink/45 dark:bg-[#e9e6e2]/45" />
      <span className="h-[7px] w-[7px] rounded-full border-2 border-ink/30 dark:border-[#e9e6e2]/30" />
    </span>
  );
}

export function HeroSteps({ className }: { className?: string }) {
  return (
    <span className={cn("relative ml-1 inline-flex -translate-y-1 items-end gap-1 align-middle", className)} aria-hidden>
      <span className="h-4 w-2.5 rounded-[4px] border hairline bg-white dark:bg-[#1d1d1d] sm:h-5" />
      <span className="h-6 w-2.5 rounded-[4px] border hairline bg-[#f3f1ec] dark:bg-[#2a2a2a] sm:h-7" />
      <span className="grid h-8 w-6 place-items-center rounded-[7px] bg-ink shadow-sm dark:bg-[#e9e6e2] sm:h-9">
        <span className="h-1.5 w-1.5 rounded-full bg-paper dark:bg-[#141414]" />
      </span>
    </span>
  );
}

export function PageHero({
  badge,
  eyebrow,
  onEyebrowClick,
  title,
  titleClassName,
  desc,
  actions,
  meta,
  className,
}: {
  badge?: ReactNode;
  eyebrow?: ReactNode;
  onEyebrowClick?: () => void;
  title: ReactNode;
  titleClassName?: string;
  desc?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  const hasEyebrow = badge != null || eyebrow != null;
  const inner = hasEyebrow ? (
    <>
      {badge != null ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-paper dark:bg-[#e9e6e2] dark:text-[#141414]">
          {badge}
        </span>
      ) : null}
      {eyebrow != null ? <span className="text-mute dark:text-[#a7a39d]">{eyebrow}</span> : null}
    </>
  ) : null;
  return (
    <section className={cn("relative", className)}>
      {hasEyebrow ? (
        onEyebrowClick ? (
          <button
            type="button"
            onClick={onEyebrowClick}
            className="group inline-flex items-center gap-2 rounded-full border hairline bg-white py-1 pl-1.5 pr-2.5 text-left text-[12px] font-medium shadow-sm transition hover:-translate-y-px dark:bg-[#1d1d1d]"
          >
            {inner}
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-px group-hover:translate-x-px" strokeWidth={1.75} />
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full border hairline bg-white py-1 pl-1.5 pr-2.5 text-[12px] font-medium shadow-sm dark:bg-[#1d1d1d]">
            {inner}
          </div>
        )
      ) : null}

      <h1 className={cn("relative font-display text-[34px] font-[300] leading-[1.02] tracking-[-0.04em] sm:text-[46px]", hasEyebrow ? "mt-5" : "mt-0", titleClassName)}>
        {title}
      </h1>

      {desc ? (
        <p className="mt-4 max-w-[52ch] text-[14px] leading-[1.75] text-mute dark:text-[#a7a39d]">{desc}</p>
      ) : null}

      {actions ? <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">{actions}</div> : null}

      {meta ? (
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-mute dark:text-[#8f8b85]">{meta}</div>
      ) : null}
    </section>
  );
}

export function SectionHead({
  kicker,
  title,
  desc,
  action,
}: {
  kicker: string;
  title: ReactNode;
  desc?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="kicker">{kicker}</div>
        <h2 className="mt-1.5 font-display text-[20px] font-[400] leading-tight tracking-[-0.02em] sm:text-[22px]">{title}</h2>
        {desc ? <p className="mt-1 text-[13px] leading-relaxed text-mute dark:text-[#a7a39d]">{desc}</p> : null}
      </div>
      {action ? <div className="shrink-0 pb-0.5">{action}</div> : null}
    </div>
  );
}
