"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { createClient } from "./server";

export async function toggleRecurring(
  id: string,
  active: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const { data: tenant } = await supabase.from("tenants").select("id").maybeSingle();
    if (!tenant) return { ok: false, error: "Tenant não encontrado" };

    const { error } = await supabase
      .from("recurring_transactions")
      .update({ active })
      .eq("id", id)
      .eq("tenant_id", tenant.id);

    if (error) {
      Sentry.captureException(error);
      return { ok: false, error: "Erro ao atualizar" };
    }

    revalidatePath("/dashboard/recorrencias");
    return { ok: true };
  } catch (err) {
    Sentry.captureException(err);
    return { ok: false, error: "Erro interno" };
  }
}

export async function deleteRecurring(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const { data: tenant } = await supabase.from("tenants").select("id").maybeSingle();
    if (!tenant) return { ok: false, error: "Tenant não encontrado" };

    const { error } = await supabase
      .from("recurring_transactions")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenant.id);

    if (error) {
      Sentry.captureException(error);
      return { ok: false, error: "Erro ao excluir" };
    }

    revalidatePath("/dashboard/recorrencias");
    return { ok: true };
  } catch (err) {
    Sentry.captureException(err);
    return { ok: false, error: "Erro interno" };
  }
}
