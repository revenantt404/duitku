import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-[22px] w-[100px]" />
          <Skeleton className="h-[14px] w-[200px]" />
        </div>
        <Skeleton className="h-8 w-[90px] rounded-full" />
      </div>
      <Skeleton className="h-9 w-[180px] rounded-full" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}><CardContent className="p-3.5 flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-xl" /><div className="space-y-1.5 flex-1"><Skeleton className="h-[13px] w-[100px]" /><Skeleton className="h-[11px] w-[140px]" /></div></CardContent></Card>
        ))}
      </div>
    </div>
  );
}
