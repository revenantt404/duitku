import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-[13px] font-medium transition-[transform,colors] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/15 dark:focus-visible:ring-white/15 disabled:pointer-events-none disabled:opacity-50 touch-manipulation press",
  {
    variants: {
      variant: {
        default: "bg-ink text-paper hover:bg-[#2a2a2a] dark:bg-[#e9e6e2] dark:text-[#141414] dark:hover:bg-white",
        primary: "bg-ink text-paper hover:bg-[#2a2a2a] dark:bg-[#e9e6e2] dark:text-[#141414] dark:hover:bg-white",
        destructive: "bg-ink text-paper hover:bg-[#2a2a2a] dark:bg-[#e9e6e2] dark:text-[#141414]",
        outline: "border hairline bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.06] text-ink dark:text-[#e9e6e2]",
        secondary: "bg-[#f3f1ec] dark:bg-[#222] text-ink dark:text-[#e9e6e2] hover:bg-[#ecebe8] dark:hover:bg-[#2a2a2a] border hairline",
        ghost: "hover:bg-black/[0.03] dark:hover:bg-white/[0.06] text-mute dark:text-[#a7a39d] hover:text-ink dark:hover:text-[#e9e6e2]",
        link: "text-ink dark:text-[#e9e6e2] underline-offset-4 hover:underline decoration-[#c9c5c0] dark:decoration-[#3a3a3a]",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-[12px]",
        lg: "h-10 px-5 text-[14px]",
        icon: "h-9 w-9",
        fab: "h-10 w-10 rounded-full bg-ink text-paper dark:bg-[#e9e6e2] dark:text-[#141414] hover:opacity-90",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
