"use client";
import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

type RupiahInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "defaultValue"> & {
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
  withPrefix?: boolean;
};

export function RupiahInput({
  value,
  onValueChange,
  className,
  placeholder = "0",
  withPrefix = true,
  autoFocus,
  id,
  disabled,
  ...props
}: RupiahInputProps) {
  const ref = React.useRef<HTMLInputElement>(null);
  const hasValue = typeof value === "number" && Number.isFinite(value);
  const numeric = hasValue ? (value as number) : 0;
  // 0 tetap "0" biar beda dengan kosong (placeholder) — fix: sebelumnya 0 => "" jadi kelihatan kosong
  const display = hasValue ? new Intl.NumberFormat("id-ID").format(numeric) : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    if (digits === "") {
      onValueChange(undefined as any);
      return;
    }
    const sliced = digits.slice(0, 12);
    const num = parseInt(sliced, 10);
    if (!Number.isFinite(num)) return;
    onValueChange(num);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const len = el.value.length;
      try { el.setSelectionRange(len, len); } catch {}
    });
  }

  return (
    <div className="relative">
      {withPrefix && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium leading-none text-mute dark:text-[#8f8b85] select-none">
          Rp
        </span>
      )}
      <Input
        ref={ref}
        id={id}
        disabled={disabled}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={display}
        onChange={handleChange}
        autoFocus={autoFocus}
        className={cn(
          "num tabular-nums",
          withPrefix ? "pl-[2.55rem]" : "",
          className
        )}
        {...props}
      />
    </div>
  );
}
