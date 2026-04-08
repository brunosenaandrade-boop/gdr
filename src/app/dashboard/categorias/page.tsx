import { getCategories, getTenant } from "@/lib/supabase/queries";
import { CategoriasClient } from "./client";

export default async function CategoriasPage() {
  const [categories, tenant] = await Promise.all([
    getCategories(),
    getTenant(),
  ]);

  return <CategoriasClient categories={categories} tenantId={tenant?.id ?? ""} />;
}
