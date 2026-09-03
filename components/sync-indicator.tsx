"use client";

export function SyncIndicator({ fetching, label = "Sinkron…" }: { fetching: boolean; label?: string }) {
  if (!fetching) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-mute dark:text-[#8f8b85]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#1a7a4a] dark:bg-[#4ade80] animate-pulse" aria-hidden />
      {label}
    </span>
  );
}
