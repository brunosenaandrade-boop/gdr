import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Path não informado" }, { status: 400 });
  }

  // Verificar se o usuário tem uma compra com esse arquivo
  const { data: tenant } = await supabase.from("tenants").select("id").maybeSingle();
  if (!tenant) {
    return NextResponse.json({ error: "Tenant não encontrado" }, { status: 403 });
  }

  const { data: purchases } = await supabase
    .from("purchase_bumps")
    .select("bump_product_id")
    .eq("tenant_id", tenant.id)
    .not("bump_product_id", "is", null);

  if (!purchases || purchases.length === 0) {
    return NextResponse.json({ error: "Nenhuma compra encontrada" }, { status: 403 });
  }

  // Gerar signed URL (24h)
  const { createServiceClient } = await import("@/lib/supabase/server");
  const service = await createServiceClient();

  const { data: signedUrl, error } = await service.storage
    .from("bump-products")
    .createSignedUrl(path, 86400); // 24 horas

  if (error || !signedUrl?.signedUrl) {
    return NextResponse.json({ error: "Erro ao gerar link" }, { status: 500 });
  }

  return NextResponse.json({ url: signedUrl.signedUrl });
}
