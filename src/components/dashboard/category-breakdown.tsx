"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PieChartIcon } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

type CategoryData = {
  name: string;
  value: number;
  color: string;
};

type CategoryBreakdownProps = {
  data: CategoryData[];
  title?: string;
};

const COLORS = [
  "#34d399", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa",
  "#fb923c", "#22d3ee", "#f87171", "#4ade80", "#e879f9",
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0];
  return (
    <div className="rounded-xl border border-white/10 bg-black/90 px-3 py-2 shadow-xl backdrop-blur-xl">
      <p className="text-xs text-slate-200">{data.name}</p>
      <p className="text-xs text-emerald-300">{formatCurrency(data.value)}</p>
    </div>
  );
}

export function CategoryBreakdown({ data, title = "Despesas por Categoria" }: CategoryBreakdownProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {data.length === 0 ? (
        <div className="flex h-[180px] flex-col items-center justify-center gap-3">
          <PieChartIcon className="h-10 w-10 text-emerald-500/30" />
          <div className="text-center">
            <p className="text-sm text-slate-400">Nenhuma categoria ainda</p>
            <p className="text-xs text-slate-600 mt-1">
              As categorias aparecem conforme você adiciona lançamentos
            </p>
          </div>
        </div>
      ) : (
      <div className="flex items-center gap-6">
        <div className="h-[180px] w-[180px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={entry.color || COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.slice(0, 5).map((item, i) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color || COLORS[i % COLORS.length] }}
                />
                <span className="text-xs text-slate-400">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 tabular-nums">
                  {formatCurrency(item.value)}
                </span>
                <span className="text-[0.65rem] text-slate-600 tabular-nums w-8 text-right">
                  {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </Card>
  );
}
