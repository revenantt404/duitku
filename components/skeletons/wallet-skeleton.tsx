import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function WalletSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-[22px] w-[80px]" />
          <Skeleton className="h-[13px] w-[220px]" />
        </div>
        <Skeleton className="h-9 w-[90px] rounded-full shrink-0" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-[14px] w-[120px]" />
          <Skeleton className="h-9 w-full rounded-[14px]" />
          <Skeleton className="h-9 w-full rounded-[14px]" />
        </CardContent>
      </Card>
    </div>
  );
}
