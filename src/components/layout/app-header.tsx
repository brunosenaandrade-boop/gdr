"use client";

import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

type AppHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function AppHeader({ title, description, children }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-black/80 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-base font-medium tracking-tight text-white">{title}</h1>
            {description && (
              <p className="text-xs text-slate-500">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {children}
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar..."
              className="h-7 w-48 rounded-full border border-white/10 bg-white/5 pl-8 pr-3 text-xs text-slate-300 placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none"
            />
          </div>
          <Badge variant="success" pulse>
            Online
          </Badge>
        </div>
      </div>
    </header>
  );
}
