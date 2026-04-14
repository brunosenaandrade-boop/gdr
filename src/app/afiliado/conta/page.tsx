import { redirect } from "next/navigation";
import { getCurrentAffiliate } from "@/lib/affiliates/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { AfiliadoShell } from "../layout";
import { ContaClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AfiliadoContaPage() {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) redirect("/afiliado/login");

  const service = await createServiceClient();
  const { data } = await service
    .from("affiliates")
    .select("name, phone, pix_key, cpf_cnpj, hotmart_email, commission_rate")
    .eq("id", affiliate.affiliateId)
    .maybeSingle();

  return (
    <AfiliadoShell>
      <ContaClient
        email={affiliate.email}
        mustChangePassword={affiliate.mustChangePassword}
        commissionRate={Number(data?.commission_rate ?? 40)}
        profile={{
          name: data?.name ?? affiliate.name,
          phone: data?.phone ?? "",
          pix_key: data?.pix_key ?? "",
          cpf_cnpj: data?.cpf_cnpj ?? "",
          hotmart_email: data?.hotmart_email ?? "",
        }}
      />
    </AfiliadoShell>
  );
}
