import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TransactionSkeleton() {
  return (
    <div className="space-y-5">
      {/* hero editorial — tanpa pil eyebrow */}
      <div className="space-y-2">
        <Skeleton className="h-[38px] w-[250px]" />
        <Skeleton className="h-[38px] w-[210px]" />
        <Skeleton className="h-[14px] w-[280px]" />
      </div>

      <Skeleton className="h-[40px] w-full rounded-full" />

      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="h-10 w-[110px] rounded-full" />
      </div>

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
