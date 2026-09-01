import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-9 w-full rounded-[14px] border hairline bg-white dark:bg-[#1e1e1e] px-3 py-1 text-[14px] text-ink dark:text-[#e9e6e2] placeholder:text-mute dark:placeholder:text-[#8f8b85] focus-visible:outline-none focus-visible:border-ink dark:focus-visible:border-[#3a3a3a] disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";
export { Input };
