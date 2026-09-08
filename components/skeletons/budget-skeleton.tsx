import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BudgetSkeleton() {
  return (
    <div className="space-y-5">
      {/* hero editorial — tanpa pil eyebrow */}
      <div className="space-y-2">
        <Skeleton className="h-[38px] w-[220px]" />
        <Skeleton className="h-[38px] w-[180px]" />
        <Skeleton className="h-[14px] w-[240px]" />
      </div>

      <Skeleton className="h-[40px] w-full rounded-full" />

      {/* ringkasan 3 kolom */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="text-center">
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-[11px] w-[50px] mx-auto" />
              <Skeleton className="h-[14px] w-[70px] mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>

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
      {/* hero editorial — tanpa pil eyebrow */}
      <div className="space-y-2">
        <Skeleton className="h-[38px] w-[230px]" />
        <Skeleton className="h-[38px] w-[190px]" />
        <Skeleton className="h-[14px] w-[250px]" />
      </div>

      <Skeleton className="h-[40px] w-full rounded-full" />

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
