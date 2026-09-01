import { cn } from "@/lib/utils";
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("shimmer rounded-[12px] bg-[#f3f1ec] dark:bg-[#1d1d1d]", className)} {...props} />;
}
