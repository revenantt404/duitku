"use client";
import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "@/components/theme-provider";
import { formatRupiah, formatRupiahCompact } from "@/lib/utils";

// Vibrant palette yang lolos kontras di dark #1d1d1d maupun light #fff
const PALETTE = ["#2DD4BF", "#FB7185", "#FBBF24", "#A78BFA", "#38BDF8", "#4ADE80", "#FB923C", "#F472B6"];

// Tooltip custom: text SELALU terang di dark mode.
// Tooltip bawaan Recharts mewarnai tiap baris dengan `entry.color || '#000'`
// (warna slice / fallback hitam) → di bg gelap jadi tidak terbaca.
function DonutTooltip({ active, payload, isDark }: { active?: boolean; payload?: any[]; isDark: boolean }) {
  if (!active || !payload?.length) return null;
  const text = isDark ? "#e9e6e2" : "#1a1a1a";
  const sub = isDark ? "#a7a39d" : "#6b6b6b";
  return (
    <div
      className="rounded-xl border px-3 py-2 text-[12px] space-y-1"
      style={{
        background: isDark ? "#1d1d1d" : "#fff",
        borderColor: isDark ? "#2a2a2a" : "#e6e3df",
        boxShadow: "none",
      }}
    >
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5 whitespace-nowrap">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: entry.payload?.color ?? entry.color ?? sub }}
            aria-hidden
          />
          <span className="font-medium" style={{ color: text }}>{entry.name}</span>
          <span className="num" style={{ color: sub }}>{formatRupiah(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function ExpenseDonut({ data }: { data: { name: string; value: number; color: string }[] }) {
  const { resolved } = useTheme();
  const isDark = resolved === "dark";

  const total = React.useMemo(() => data.reduce((a, b) => a + b.value, 0), [data]);

  if (!data.length)
    return (
      <div className="py-10 text-center">
        <div className="mx-auto h-10 w-10 rounded-xl bg-[#f3f1ec] dark:bg-[#1d1d1d] grid place-items-center text-mute dark:text-[#8f8b85] text-[11px] border hairline">—</div>
        <div className="text-[12px] font-medium text-ink dark:text-[#e9e6e2] mt-2">Belum ada pengeluaran bulan ini</div>
        <div className="text-[11px] text-mute dark:text-[#8f8b85]">Tambah transaksi untuk melihat breakdown</div>
      </div>
    );

  const filled = data.map((d, i) => ({ ...d, color: PALETTE[i % PALETTE.length] }));
  const stroke = isDark ? "#1d1d1d" : "#fff";

  return (
    <div>
      {/* Pie diberi ruang sendiri — legend di luar ResponsiveContainer biar gak makan height chart */}
      <div className="relative h-[220px] sm:h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Pie
              data={filled}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={96}
              paddingAngle={3}
              stroke={stroke}
              strokeWidth={2}
            >
              {filled.map((e, i) => (
                <Cell key={i} fill={e.color} stroke={stroke} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip isDark={isDark} />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center total — absolute biar gak ganggu layout Recharts */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-[15px] font-semibold tracking-tight num text-ink dark:text-[#e9e6e2]">
              {formatRupiahCompact(total)}
            </div>
            <div className="text-[11px] text-mute dark:text-[#a7a39d]">
              {filled.length} kategori
            </div>
          </div>
        </div>
      </div>
      {/* Legend custom: wrap rapi, kontras, ada nominal + % */}
      <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {filled.map((e) => {
          const pct = total ? Math.round((e.value / total) * 100) : 0;
          return (
            <li
              key={e.name}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink dark:text-[#e9e6e2]"
              title={`${e.name} — ${formatRupiah(e.value)} (${pct}%)`}
            >
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: e.color }} aria-hidden />
              <span className="truncate max-w-[140px]">{e.name}</span>
              <span className="num text-mute dark:text-[#a7a39d]">
                {formatRupiahCompact(e.value)} · {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
