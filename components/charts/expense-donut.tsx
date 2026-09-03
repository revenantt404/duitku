"use client";
import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTheme } from "@/components/theme-provider";

const PALETTE = ["#1a7a4a", "#b42318", "#a16207", "#1a1a1a", "#6b6b6b", "#9a9590", "#c9c5c0", "#e6e3df"];

function useDonutBreakpoint() {
  const [w, setW] = React.useState<number>(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
  React.useEffect(() => {
    function onResize() { setW(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  if (w < 380) return "xs" as const;
  if (w < 640) return "sm" as const;
  return "lg" as const;
}

export function ExpenseDonut({ data }: { data: { name: string; value: number; color: string }[] }) {
  const { resolved } = useTheme();
  const isDark = resolved === "dark";
  const bp = useDonutBreakpoint();

  if (!data.length)
    return (
      <div className="py-10 text-center">
        <div className="mx-auto h-10 w-10 rounded-xl bg-[#f3f1ec] dark:bg-[#1d1d1d] grid place-items-center text-mute dark:text-[#8f8b85] text-[11px] border hairline">—</div>
        <div className="text-[12px] font-medium text-ink dark:text-[#e9e6e2] mt-2">Belum ada pengeluaran bulan ini</div>
        <div className="text-[11px] text-mute dark:text-[#8f8b85]">Tambah transaksi untuk melihat breakdown</div>
      </div>
    );

  const filled = data.map((d, i) => ({ ...d, color: PALETTE[i % PALETTE.length] }));

  // responsive radii per Q17: 72/82/90 + inner 52/58/62
  const outerRadius = bp === "xs" ? 72 : bp === "sm" ? 82 : 90;
  const innerRadius = bp === "xs" ? 52 : bp === "sm" ? 58 : 62;

  return (
    <div className="h-[160px] sm:h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={filled} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={3} stroke={isDark ? "#1d1d1d" : "#fff"} strokeWidth={2}>
            {filled.map((e, i) => (
              <Cell key={i} fill={e.color} stroke={isDark ? "#1d1d1d" : "#fff"} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v)}
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${isDark ? "#2a2a2a" : "#e6e3df"}`,
              fontSize: 11,
              boxShadow: "none",
              background: isDark ? "#1d1d1d" : "#fff",
              color: isDark ? "#e9e6e2" : "#1a1a1a",
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{
              fontSize: 11,
              color: isDark ? "#8f8b85" : "#6b6b6b",
              whiteSpace: "normal",
              lineHeight: 1.4,
              marginTop: 8,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
