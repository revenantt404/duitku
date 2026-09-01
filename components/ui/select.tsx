"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "flex h-9 w-full appearance-none rounded-[14px] border hairline bg-white dark:bg-[#1e1e1e] px-3 py-1 pr-9 text-[14px] text-ink dark:text-[#e9e6e2] focus-visible:outline-none focus-visible:border-ink dark:focus-visible:border-[#3a3a3a] disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute dark:text-[#a7a39d]" />
  </div>
));
Select.displayName = "Select";

export const SelectItem = ({ children, ...props }: React.OptionHTMLAttributes<HTMLOptionElement>) => (
  <option {...props}>{children}</option>
);
