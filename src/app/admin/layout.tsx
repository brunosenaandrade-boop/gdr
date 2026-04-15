import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin/auth";
import { adminSignOut } from "@/lib/admin/actions";
import { LayoutDashboard, Users, CreditCard, AlertTriangle, ScrollText, LogOut, Shield, ShieldCheck, Handshake, Tag, Wallet, Package } from "lucide-react";

export const metadata = {
  title: "Admin — Guarda Dinheiro",
  robots: "noindex, nofollow",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // A página /admin/login tem seu próprio layout (não precisa de auth)
  // Mas é difícil separar via layout aninhado sem mover a pasta — então aqui vamos permitir a rota de login.
  // O middleware já garante redirect.
  return <>{children}</>;
}

/**
 * Shell usado dentro de cada página autenticada do admin (não no login).
 */
export async function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Usuários", icon: Users },
    { href: "/admin/subscriptions", label: "Assinaturas", icon: CreditCard },
    { href: "/admin/affiliates", label: "Afiliados", icon: Handshake },
    { href: "/admin/coupons", label: "Cupons", icon: Tag },
    { href: "/admin/payouts", label: "Pagamentos", icon: Wallet },
    { href: "/admin/bumps", label: "Order Bumps", icon: Package },
    { href: "/admin/abuse", label: "Abuso IA", icon: AlertTriangle },
    { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
    { href: "/admin/security", label: "Segurança", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen border-r border-zinc-800 bg-zinc-900/50 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Super Admin</p>
              <p className="text-xs text-zinc-500">{admin.email}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <form action={async () => { "use server"; await adminSignOut(); redirect("/admin/login"); }}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
