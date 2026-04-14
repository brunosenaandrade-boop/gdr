import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAffiliate } from "@/lib/affiliates/auth";
import { signOutAffiliate } from "@/lib/affiliates/affiliate-actions";
import { LayoutDashboard, ShoppingCart, FileText, LogOut, Handshake } from "lucide-react";

export const metadata = {
  title: "Afiliado — Guarda Dinheiro",
  robots: "noindex, nofollow",
};

export default function AfiliadoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export async function AfiliadoShell({ children }: { children: React.ReactNode }) {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) redirect("/afiliado/login");

  if (affiliate.status !== "active") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-xl font-bold text-gray-900">Conta {affiliate.status === "suspended" ? "suspensa" : "bloqueada"}</h1>
          <p className="text-sm text-gray-600 mt-3">
            Sua conta de afiliado está temporariamente {affiliate.status === "suspended" ? "suspensa" : "bloqueada"}.
            Entre em contato com o administrador.
          </p>
          <form action={async () => { "use server"; await signOutAffiliate(); redirect("/afiliado/login"); }}>
            <button className="mt-6 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg">
              Sair
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/afiliado", label: "Dashboard", icon: LayoutDashboard },
    { href: "/afiliado/vendas", label: "Vendas", icon: ShoppingCart },
    { href: "/afiliado/materiais", label: "Materiais", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex">
        <aside className="w-64 min-h-screen border-r border-gray-200 bg-white p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Handshake className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Painel Afiliado</p>
              <p className="text-xs text-gray-500">{affiliate.name}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <form action={async () => { "use server"; await signOutAffiliate(); redirect("/afiliado/login"); }}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
