import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-[22px] w-[120px]" />
          <Skeleton className="h-[14px] w-[200px]" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      </div>

      <Card className="rounded-[18px] overflow-hidden shadow-sm">
        <CardContent className="p-6">
          <Skeleton className="h-[11px] w-[90px]" />
          <Skeleton className="mt-2 h-[30px] w-[180px]" />
          <div className="mt-5 grid grid-cols-3 gap-4 border-t hairline pt-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className={i > 0 ? "border-l hairline pl-4 space-y-2" : "space-y-2"}>
                <Skeleton className="h-[11px] w-[50px]" />
                <Skeleton className="h-[14px] w-[80px]" />
                <Skeleton className="h-[11px] w-[60px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-[12px] w-[60px]" />
          <Skeleton className="h-[12px] w-[60px]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="rounded-[18px] shadow-sm">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-[14px] w-[80px]" />
                <Skeleton className="h-[18px] w-[120px]" />
                <Skeleton className="h-[11px] w-[60px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="space-y-2">
          <Skeleton className="h-[16px] w-[180px]" />
          <Skeleton className="h-[12px] w-[100px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[180px] w-full rounded-[14px]" />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="space-y-2">
          <Skeleton className="h-[16px] w-[160px]" />
          <Skeleton className="h-[12px] w-[90px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[180px] w-full rounded-[14px]" />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-2">
            <Skeleton className="h-[14px] w-[140px]" />
            <Skeleton className="h-[12px] w-[100px]" />
          </div>
          <Skeleton className="h-8 w-[90px] rounded-full" />
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-[14px] border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d] px-3.5 py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                <div className="space-y-1.5 min-w-0 flex-1">
                  <Skeleton className="h-[13px] w-[120px]" />
                  <Skeleton className="h-[12px] w-[160px]" />
                </div>
              </div>
              <Skeleton className="h-[13px] w-[80px]" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
