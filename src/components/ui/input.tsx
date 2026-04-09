"use client";

import { cn } from "@/lib/utils";
import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, type, ...props }, ref) => {
    const isPassword = type === "password";
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-slate-400">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            type={isPassword ? (showPassword ? "text" : "password") : type}
            className={cn(
              "h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200",
              "placeholder:text-slate-600 transition-colors duration-200",
              "focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-emerald-500/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              icon && "pl-9",
              isPassword && "pr-9",
              error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20",
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
export { Input };
export type { InputProps };
