"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { formatRupiahCompact } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

export function MonthlyBar({ data }: { data: { month: string; income: number; expense: number }[] }) {
  const { resolved } = useTheme();
  const isDark = resolved === "dark";
  if (!data.length)
    return (
      <div className="py-10 text-center">
        <div className="mx-auto h-10 w-10 rounded-xl bg-[#f3f1ec] dark:bg-[#1d1d1d] grid place-items-center text-mute dark:text-[#8f8b85] text-[11px] border hairline">—</div>
        <div className="text-[12px] font-medium text-ink dark:text-[#e9e6e2] mt-2">Belum ada data 6 bulan</div>
      </div>
    );
  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap={22}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2a2a2a" : "#e6e3df"} vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: isDark ? "#8f8b85" : "#6b6b6b" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => formatRupiahCompact(v)} tick={{ fontSize: 11, fill: isDark ? "#8f8b85" : "#6b6b6b" }} width={68} axisLine={false} tickLine={false} />
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
          <Legend wrapperStyle={{ fontSize: 11, color: isDark ? "#8f8b85" : "#6b6b6b" }} iconType="circle" />
          <Bar dataKey="income" name="Masuk" fill={isDark ? "#4ade80" : "#1a7a4a"} radius={[8, 8, 0, 0]} />
          <Bar dataKey="expense" name="Keluar" fill={isDark ? "#fca5a5" : "#b42318"} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
