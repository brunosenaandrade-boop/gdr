import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Download, FileText, Table2, Image, File, ExternalLink } from "lucide-react";
import { MateriaisClient } from "./client";

export default async function MateriaisPage() {
  const supabase = await createClient();
  const { data: tenant } = await supabase.from("tenants").select("id").maybeSingle();

  if (!tenant) {
    return (
      <>
        <AppHeader title="Meus Materiais" description="Downloads de produtos adquiridos" />
        <div className="p-6">
          <Card className="py-20 text-center text-sm text-slate-500">
            Nenhum material disponível.
          </Card>
        </div>
      </>
    );
  }

  const { data: purchases } = await supabase
    .from("purchase_bumps")
    .select("id, bump_name, amount_cents, delivery_status, delivered_at, created_at, bump_product_id")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  // Buscar produtos com arquivos
  const productIds = [...new Set((purchases ?? []).map((p) => p.bump_product_id).filter((id): id is string => !!id))];
  let products: Record<string, { name: string; files: unknown[] }> = {};

  if (productIds.length > 0) {
    const { data: bumpProducts } = await supabase
      .from("bump_products")
      .select("id, name, files")
      .in("id", productIds);

    for (const bp of bumpProducts ?? []) {
      products[bp.id] = { name: bp.name, files: (bp.files as unknown[]) ?? [] };
    }
  }

  return (
    <>
      <AppHeader title="Meus Materiais" description="Downloads de produtos adquiridos" />
      <div className="p-6">
        {(!purchases || purchases.length === 0) ? (
          <Card className="py-20 text-center">
            <FileText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Você ainda não tem materiais.</p>
            <p className="text-xs text-slate-600 mt-2 mb-5">
              Materiais adquiridos no checkout aparecerão aqui para download.
            </p>
            <Link
              href="/planos"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/15 hover:text-emerald-200 transition-colors"
            >
              Ver planos e bônus disponíveis
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => {
              const product = purchase.bump_product_id ? products[purchase.bump_product_id] : null;
              const files = (product?.files ?? []) as Array<{ storage_path?: string; filename: string; size_bytes?: number }>;

              return (
                <Card key={purchase.id} className="p-0 overflow-hidden">
                  <div className="p-5 border-b border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-white">{purchase.bump_name}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Adquirido em {purchase.created_at ? new Date(purchase.created_at).toLocaleDateString("pt-BR") : "—"}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        purchase.delivery_status === "delivered"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : purchase.delivery_status === "failed"
                          ? "bg-red-500/15 text-red-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}>
                        {purchase.delivery_status === "delivered" ? "Disponível" : purchase.delivery_status === "failed" ? "Erro" : "Processando"}
                      </span>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <MateriaisClient files={files} />
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
