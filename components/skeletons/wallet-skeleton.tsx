import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function WalletSkeleton() {
  return (
    <div className="space-y-5">
      {/* hero editorial — tanpa pil eyebrow */}
      <div className="space-y-2">
        <Skeleton className="h-[38px] w-[230px]" />
        <Skeleton className="h-[38px] w-[190px]" />
        <Skeleton className="h-[14px] w-[240px]" />
      </div>

      <Skeleton className="h-[40px] w-full rounded-full" />

      {/* total panel inverted */}
      <div className="rounded-[18px] bg-ink dark:bg-[#e9e6e2] p-5">
        <Skeleton className="h-[11px] w-[140px] opacity-60" />
        <Skeleton className="mt-2 h-[32px] w-[180px] opacity-60" />
        <Skeleton className="mt-1 h-[12px] w-[120px] opacity-40" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="rounded-[18px] shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <Skeleton className="h-5 w-[60px] rounded-full" />
              </div>
              <Skeleton className="h-[16px] w-[100px]" />
              <Skeleton className="h-[22px] w-[140px]" />
              <Skeleton className="h-[12px] w-[80px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
