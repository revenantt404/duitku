import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BudgetSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-[22px] w-[100px]" />
          <Skeleton className="h-[13px] w-[180px]" />
        </div>
        <Skeleton className="h-9 w-[90px] rounded-full shrink-0" />
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 flex gap-2">
          <Skeleton className="h-9 w-[100px] rounded-[14px]" />
          <Skeleton className="h-9 flex-1 rounded-[14px]" />
        </CardContent>
      </Card>

      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-[13px] w-[80px]" />
                <Skeleton className="h-[12px] w-[140px]" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-[11px] w-[60px]" />
                <Skeleton className="h-[11px] w-[60px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function GoalSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-[22px] w-[80px]" />
          <Skeleton className="h-[13px] w-[200px]" />
        </div>
        <Skeleton className="h-9 w-[90px] rounded-full shrink-0" />
      </div>

      <div className="grid gap-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="rounded-[18px] shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-[14px] w-[120px]" />
                <Skeleton className="h-5 w-[50px] rounded-full" />
              </div>
              <Skeleton className="h-[13px] w-[160px]" />
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-[11px] w-[40px]" />
                <Skeleton className="h-[11px] w-[80px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
