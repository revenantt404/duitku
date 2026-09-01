import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TransactionSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-[22px] w-[110px]" />
          <Skeleton className="h-[13px] w-[200px]" />
        </div>
        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 grid gap-3">
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-[14px]" />
            <Skeleton className="h-9 w-[120px] rounded-[14px]" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-7 w-[60px] rounded-full" />
            <Skeleton className="h-7 w-[70px] rounded-full" />
            <Skeleton className="h-7 w-[65px] rounded-full" />
          </div>
        </CardContent>
      </Card>

      {[0, 1].map((group) => (
        <Card key={group} className="shadow-sm">
          <CardContent className="p-0">
            <div className="px-4 py-2 border-b hairline flex items-center justify-between">
              <Skeleton className="h-[11px] w-[80px]" />
              <Skeleton className="h-[11px] w-[30px]" />
            </div>
            <div className="divide-y hairline">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <Skeleton className="h-[13px] w-[110px]" />
                      <Skeleton className="h-[12px] w-[140px]" />
                    </div>
                  </div>
                  <Skeleton className="h-[13px] w-[80px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
