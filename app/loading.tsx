import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-[720px] mx-auto px-6 md:px-0 pt-10 md:pt-16 pb-24 space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-[12px] w-[160px]" />
        <Skeleton className="h-[44px] w-[280px]" />
        <Skeleton className="h-[16px] w-[420px]" />
        <Skeleton className="h-11 w-[160px] rounded-full mt-4" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[72px] rounded-[18px]" />
        ))}
      </div>
      <Skeleton className="h-[220px] rounded-[18px]" />
    </div>
  );
}
