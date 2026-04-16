"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import type { DashboardScore } from "@/lib/supabase/score-actions";

type Props = {
  score: DashboardScore | null;
};

const COMPONENT_LABELS: Record<string, string> = {
  saldo_positivo: "Saldo positivo",
  pontualidade: "Pontualidade",
  constancia: "Constância",
  recorrencias: "Recorrências",
  diversidade: "Diversidade",
  historico_positivo: "Histórico positivo",
  maturidade: "Maturidade",
};

const COMPONENT_MAX: Record<string, number> = {
  saldo_positivo: 250,
  pontualidade: 200,
  constancia: 150,
  recorrencias: 100,
  diversidade: 100,
  historico_positivo: 150,
  maturidade: 50,
};

function tierColor(tier: string): string {
  switch (tier) {
    case "excelente":
      return "#10b981";
    case "bom":
      return "#34d399";
    case "regular":
      return "#facc15";
    case "baixo":
      return "#f97316";
    default:
      return "#ef4444";
  }
}

export function FinancialScoreCard({ score }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!score) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Score Financeiro</CardTitle>
        </CardHeader>
        <div className="flex h-[260px] flex-col items-center justify-center gap-3">
          <Sparkles className="h-10 w-10 text-emerald-500/30" />
          <p className="text-sm text-slate-400">Comece a lançar pra calcular seu score</p>
        </div>
      </Card>
    );
  }

  const color = tierColor(score.tier);
  const chartData = [{ name: "score", value: score.score, fill: color }];
  const delta = score.previous !== undefined ? score.score - score.previous : undefined;

  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: color, opacity: 0.08 }}
      />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-normal uppercase tracking-[0.12em] text-emerald-300/70">
              Score Financeiro
            </p>
            <p className="mt-1 text-[0.7rem] text-slate-500">0 a 1000</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="relative h-[150px] w-[150px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={chartData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 1000]} tick={false} />
                <RadialBar background={{ fill: "rgba(255,255,255,0.04)" }} dataKey="value" cornerRadius={12} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[2rem] font-bold tracking-tight text-white tabular-nums leading-none">
                {score.score}
              </span>
              <span className="mt-1 text-xs text-slate-400">{score.emoji} {score.label}</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {delta !== undefined && (
              <div className="flex items-center gap-2">
                {delta > 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                ) : delta < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                ) : (
                  <Minus className="h-4 w-4 text-slate-500" />
                )}
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    delta > 0 ? "text-emerald-300" : delta < 0 ? "text-red-400" : "text-slate-500",
                  )}
                >
                  {delta > 0 ? "+" : ""}
                  {delta} vs semana passada
                </span>
              </div>
            )}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-emerald-300 hover:text-emerald-200 transition-colors"
            >
              {expanded ? "Ocultar detalhamento" : "Ver detalhamento →"}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
            {Object.entries(score.breakdown).map(([key, val]) => {
              const max = COMPONENT_MAX[key] ?? 100;
              const pct = Math.round((val / max) * 100);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{COMPONENT_LABELS[key] ?? key}</span>
                    <span className="tabular-nums text-slate-300">
                      {val}/{max}
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
