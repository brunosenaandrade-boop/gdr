"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "white";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "aura-button-green-beam text-white border-none hover:scale-105 active:scale-95",
  secondary:
    "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95",
  ghost:
    "bg-transparent text-slate-300 hover:bg-white/5 hover:text-slate-100",
  danger:
    "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30",
  white:
    "bg-white text-black font-medium hover:scale-105 active:scale-95",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex items-center justify-center rounded-full font-medium tracking-tight transition-all duration-200 outline-none disabled:opacity-50 disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {variant === "primary" && (
          <div className="points_wrapper overflow-hidden absolute inset-0 pointer-events-none rounded-full">
            {Array.from({ length: 10 }).map((_, i) => (
              <i key={i} className="point absolute bottom-[-10px] w-[2px] h-[2px] bg-emerald-50 rounded-full" style={{
                left: `${[10, 30, 25, 44, 50, 75, 88, 58, 98, 65][i]}%`,
                opacity: [1, 0.7, 0.8, 0.6, 1, 0.5, 0.9, 0.8, 0.6, 1][i],
                animationDuration: `${[2.35, 2.5, 2.2, 2.05, 1.9, 1.5, 2.2, 2.25, 2.6, 2.5][i]}s`,
                animationDelay: `${[0.2, 0.5, 0.1, 0, 0, 1.5, 0.2, 0.2, 0.1, 0.2][i]}s`,
                animation: "floating-points infinite ease-in-out",
              }} />
            ))}
          </div>
        )}
        <span className="relative z-10 flex items-center gap-2">
          {loading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {children}
        </span>
      </button>
    );
  },
);

Button.displayName = "Button";
export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
