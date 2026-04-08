import { Card } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  isCurrency?: boolean;
};

export function StatCard({ title, value, icon: Icon, trend, isCurrency = true }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-xs font-normal uppercase tracking-[0.12em] text-emerald-300/70">
            {title}
          </p>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-white tabular-nums">
          {isCurrency ? formatCurrency(value) : value.toLocaleString("pt-BR")}
        </p>
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            <span
              className={cn(
                "text-[0.7rem] font-normal tracking-tight",
                trend.positive ? "text-emerald-300" : "text-red-400",
              )}
            >
              {trend.positive ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-[0.7rem] text-slate-500">vs mes anterior</span>
          </div>
        )}
      </div>
    </Card>
  );
}
