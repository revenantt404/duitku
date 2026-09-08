import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* hero editorial — tanpa pil eyebrow */}
      <div className="space-y-2">
        <Skeleton className="h-[38px] w-[240px]" />
        <Skeleton className="h-[38px] w-[200px]" />
        <Skeleton className="h-[14px] w-[280px]" />
      </div>

      <Skeleton className="h-[40px] w-full rounded-full" />

      {/* panel saldo inverted */}
      <div className="rounded-[18px] bg-ink dark:bg-[#e9e6e2] p-5">
        <Skeleton className="h-[11px] w-[140px] opacity-60" />
        <Skeleton className="mt-2 h-[32px] w-[200px] opacity-60" />
        <Skeleton className="mt-3 h-12 w-full opacity-40" />
        <div className="mt-3 grid grid-cols-3 gap-3 border-t border-white/15 dark:border-black/15 pt-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-[11px] w-[50px] opacity-60" />
              <Skeleton className="h-[14px] w-[80px] opacity-60" />
            </div>
          ))}
        </div>
      </div>

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
