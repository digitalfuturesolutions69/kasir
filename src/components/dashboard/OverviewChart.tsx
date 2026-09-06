"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/format";

export type MonthlyPoint = {
  month: string;
  income: number;
  expense: number;
};

const INCOME_COLOR = "#059669";
const EXPENSE_COLOR = "#e11d48";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg">
      <p className="mb-1.5 text-xs font-semibold text-slate-500">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.dataKey === "income" ? INCOME_COLOR : EXPENSE_COLOR }}
          />
          <span className="text-slate-500">{p.dataKey === "income" ? "Pemasukan" : "Pengeluaran"}</span>
          <span className="ml-auto font-medium text-slate-800">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function OverviewChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-800">Tren Keuangan</p>
          <p className="text-xs text-slate-400">6 bulan terakhir</p>
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={0}
              tick={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs text-slate-500">
                  {value === "income" ? "Pemasukan" : "Pengeluaran"}
                </span>
              )}
            />
            <Bar dataKey="income" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} maxBarSize={20} />
            <Bar dataKey="expense" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
