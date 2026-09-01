"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTheme } from "@/components/theme-provider";

const PALETTE = ["#1a7a4a", "#b42318", "#a16207", "#1a1a1a", "#6b6b6b", "#9a9590", "#c9c5c0", "#e6e3df"];

export function ExpenseDonut({ data }: { data: { name: string; value: number; color: string }[] }) {
  const { resolved } = useTheme();
  const isDark = resolved === "dark";
  if (!data.length)
    return (
      <div className="py-10 text-center">
        <div className="mx-auto h-10 w-10 rounded-xl bg-[#f3f1ec] dark:bg-[#1d1d1d] grid place-items-center text-mute dark:text-[#8f8b85] text-[11px] border hairline">—</div>
        <div className="text-[12px] font-medium text-ink dark:text-[#e9e6e2] mt-2">Belum ada pengeluaran bulan ini</div>
        <div className="text-[11px] text-mute dark:text-[#8f8b85]">Tambah transaksi untuk melihat breakdown</div>
      </div>
    );
  const filled = data.map((d, i) => ({ ...d, color: PALETTE[i % PALETTE.length] }));
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={filled} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={90} paddingAngle={3} stroke={isDark ? "#1d1d1d" : "#fff"} strokeWidth={2}>
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
          <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: 11, color: isDark ? "#8f8b85" : "#6b6b6b" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
