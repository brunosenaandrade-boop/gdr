import { AppHeader } from "@/components/layout/app-header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RecorrenciasClient } from "./client";

export default async function RecorrenciasPage() {
  const supabase = await createClient();
  const { data: tenant } = await supabase.from("tenants").select("id").maybeSingle();
  if (!tenant) redirect("/dashboard");

  const { data } = await supabase
    .from("recurring_transactions")
    .select("*, category:categories(name)")
    .eq("tenant_id", tenant.id)
    .order("active", { ascending: false })
    .order("day_of_month", { ascending: true });

  return (
    <>
      <AppHeader title="Recorrências" description="Receitas e despesas que se repetem todo mês" />
      <RecorrenciasClient recurrences={(data ?? []) as Parameters<typeof RecorrenciasClient>[0]["recurrences"]} />
    </>
  );
}
