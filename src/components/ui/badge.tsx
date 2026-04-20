import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  pulse?: boolean;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-white/10 border-white/15 text-slate-300",
  success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
  warning: "bg-amber-500/10 border-amber-500/20 text-amber-300",
  danger: "bg-red-500/10 border-red-500/20 text-red-300",
  info: "bg-blue-500/10 border-blue-500/20 text-blue-300",
  outline: "bg-transparent border-emerald-300/40 text-emerald-100",
};

function Badge({ className, variant = "default", pulse, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-normal tracking-tight backdrop-blur-md",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant };
