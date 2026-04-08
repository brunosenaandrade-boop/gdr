"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowUpDown,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Tag,
  MessageSquare,
  Settings,
  Shield,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/lancamentos", label: "Lancamentos", icon: ArrowUpDown },
  { href: "/dashboard/contas-pagar", label: "Contas a Pagar", icon: TrendingDown },
  { href: "/dashboard/contas-receber", label: "Contas a Receber", icon: TrendingUp },
  { href: "/dashboard/fluxo-caixa", label: "Fluxo de Caixa", icon: BarChart3 },
  { href: "/dashboard/categorias", label: "Categorias", icon: Tag },
  { href: "/dashboard/whatsapp", label: "WhatsApp", icon: MessageSquare },
  { href: "/dashboard/configuracoes", label: "Configuracoes", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/5 bg-black/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-white/5 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
          <Shield className="h-4 w-4 text-black" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">Guarda Dinheiro</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent",
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-white/5 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
