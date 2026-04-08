import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
  glow?: boolean;
};

function Card({ className, hover, glow, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm",
        hover && "hover-card-effect cursor-pointer",
        glow && "shadow-[0_0_30px_rgba(16,185,129,0.08)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold tracking-tight text-slate-50", className)} {...props}>
      {children}
    </h3>
  );
}

function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-slate-400", className)} {...props}>
      {children}
    </p>
  );
}

function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
