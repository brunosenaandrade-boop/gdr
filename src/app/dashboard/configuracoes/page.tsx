import { getTenant } from "@/lib/supabase/queries";
import { ConfiguracoesClient } from "./client";
import { redirect } from "next/navigation";

export default async function ConfiguracoesPage() {
  const tenant = await getTenant();
  if (!tenant) redirect("/dashboard");

  return <ConfiguracoesClient tenant={tenant} />;
}
