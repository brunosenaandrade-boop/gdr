import { createClient, createServiceClient } from "@/lib/supabase/server";

export type AffiliateContext = {
  affiliateId: string;
  userId: string;
  email: string;
  name: string;
  status: "active" | "suspended" | "blocked";
  commissionRate: number;
  mustChangePassword: boolean;
  termsAcceptedAt: string | null;
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
    .select("id, user_id, email, name, status, commission_rate, must_change_password, terms_accepted_at")
    .eq("user_id", user.id)
    .maybeSingle() as { data: Record<string, unknown> | null };

  if (!data) return null;

  return {
    affiliateId: data.id as string,
    userId: (data.user_id as string) ?? user.id,
    email: data.email as string,
    name: data.name as string,
    status: data.status as AffiliateContext["status"],
    commissionRate: Number(data.commission_rate),
    mustChangePassword: (data.must_change_password as boolean) ?? false,
    termsAcceptedAt: (data.terms_accepted_at as string) ?? null,
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
