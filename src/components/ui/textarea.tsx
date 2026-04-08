"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-slate-400">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "w-full min-h-[80px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200",
            "placeholder:text-slate-600 transition-colors duration-200 resize-none",
            "focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-emerald-500/20",
            error && "border-red-500/50",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
export { Textarea };
