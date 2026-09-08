import { cn } from "@/lib/utils";

/* Marquee strip ala landing — reuse .animate-marquee + .marquee-mask di globals.css.
   Duplikasi 2 copy biar loop mulus (translateX -50%). */
export function Ticker({ items, className }: { items: string[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <div className={cn("marquee-mask overflow-hidden rounded-full border hairline bg-white py-2.5 dark:bg-[#1d1d1d]", className)}>
      <div className="animate-marquee flex w-max items-center whitespace-nowrap">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
            {items.map((t, i) => (
              <span key={`${copy}-${i}`} className="flex items-center text-[12px] font-medium tracking-wide text-mute dark:text-[#a7a39d]">
                <span className="px-4">{t}</span>
                <span className="text-[10px] opacity-60">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
