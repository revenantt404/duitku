import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-ink bg-ink text-paper dark:bg-[#e9e6e2] dark:text-[#141414] dark:border-[#2a2a2a]",
        secondary: "border hairline bg-[#f3f1ec] dark:bg-[#222] text-mute dark:text-[#a7a39d]",
        destructive: "border-ink bg-ink text-paper dark:bg-[#e9e6e2] dark:text-[#141414]",
        outline: "border hairline bg-white dark:bg-[#1d1d1d] text-mute dark:text-[#a7a39d]",
        success: "border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d] text-ink dark:text-[#e9e6e2]",
        warning: "border hairline bg-[#f3f1ec] dark:bg-[#1d1d1d] text-mute dark:text-[#a7a39d]",
        muted: "border hairline bg-white dark:bg-[#1d1d1d] text-mute dark:text-[#7f7b75]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
