import * as React from "react";
import { cn } from "@/lib/utils";
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[88px] w-full rounded-[14px] border hairline bg-white dark:bg-[#1e1e1e] px-3 py-2.5 text-[14px] text-ink dark:text-[#e9e6e2] placeholder:text-mute dark:placeholder:text-[#8f8b85] focus-visible:outline-none focus-visible:border-ink dark:focus-visible:border-[#3a3a3a]",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
