"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { CashFlowEntry } from "@/types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type CashFlowChartProps = {
  data: CashFlowEntry[];
};

function formatTick(value: number) {
  if (value >= 100000) return `${(value / 100000).toFixed(0)}k`;
  if (value >= 1000) return `${(value / 100).toFixed(0)}`;
  return String(value / 100);
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-black/90 px-3 py-2 shadow-xl backdrop-blur-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: R$ {(entry.value / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Fluxo de Caixa</CardTitle>
      </CardHeader>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatTick}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="receitas"
              name="Receitas"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#fillReceitas)"
            />
            <Area
              type="monotone"
              dataKey="despesas"
              name="Despesas"
              stroke="#f87171"
              strokeWidth={2}
              fill="url(#fillDespesas)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
