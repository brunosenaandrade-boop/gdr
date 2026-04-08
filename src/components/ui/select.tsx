"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-slate-400">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            "h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200",
            "transition-colors duration-200 appearance-none",
            "focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-emerald-500/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-500/50",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" className="bg-[#0a0a0a] text-slate-500">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#0a0a0a] text-slate-200">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
export { Select };
