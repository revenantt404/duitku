"use client";
import { cn } from "@/lib/utils";
export function Progress({ value = 0, className, indicatorClassName }: { value?: number; className?: string; indicatorClassName?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-[6px] w-full overflow-hidden rounded-full bg-[#f0ece6] dark:bg-[#2a2a2a]", className)}>
      <div className={cn("h-full bg-ink dark:bg-[#e9e6e2] rounded-full transition-all duration-300", indicatorClassName)} style={{ width: `${v}%` }} />
    </div>
  );
}
