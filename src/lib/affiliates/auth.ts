import { createClient, createServiceClient } from "@/lib/supabase/server";

export type AffiliateContext = {
  affiliateId: string;
  userId: string;
  email: string;
  name: string;
  status: "active" | "suspended" | "blocked";
  commissionRate: number;
};

/**
 * Retorna o afiliado logado ou null.
 * Usa o client com sessão do usuário — sem vazar para admin.
 */
export async function getCurrentAffiliate(): Promise<AffiliateContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const service = await createServiceClient();
  const { data } = await service
    .from("affiliates")
    .select("id, user_id, email, name, status, commission_rate")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    affiliateId: data.id,
    userId: data.user_id ?? user.id,
    email: data.email,
    name: data.name,
    status: data.status as AffiliateContext["status"],
    commissionRate: Number(data.commission_rate),
  };
}

/**
 * Afiliado precisa estar ativo pra operar.
 */
export async function requireActiveAffiliate(): Promise<AffiliateContext> {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) throw new Error("Unauthorized");
  if (affiliate.status !== "active") {
    throw new Error(`Affiliate ${affiliate.status}`);
  }
  return affiliate;
}
