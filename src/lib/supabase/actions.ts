"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./server";
import { transactionSchema, categorySchema } from "@/lib/validators/schemas";
import type { TransactionType, TransactionStatus } from "@/types";

// ===== Transactions =====

export async function createTransaction(formData: {
  type: TransactionType;
  description: string;
  amount: number;
  category_id: string | null;
  due_date: string | null;
  paid_date: string | null;
  status: TransactionStatus;
  notes: string | null;
}): Promise<{ error?: string }> {
  const parsed = transactionSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: tenant } = await supabase.from("tenants").select("id").maybeSingle();
  if (!tenant) return { error: "Tenant nao encontrado" };

  const { error } = await supabase.from("transactions").insert({
    ...parsed.data,
    tenant_id: tenant.id,
    source: "web",
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return {};
}

export async function updateTransaction(
  id: string,
  formData: {
    type: TransactionType;
    description: string;
    amount: number;
    category_id: string | null;
    due_date: string | null;
    paid_date: string | null;
    status: TransactionStatus;
    notes: string | null;
  },
): Promise<{ error?: string }> {
  const parsed = transactionSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return {};
}

export async function deleteTransaction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return {};
}

export async function markTransactionPaid(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { error } = await supabase
    .from("transactions")
    .update({ status: "pago", paid_date: today, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return {};
}

// ===== Categories =====

export async function createCategory(formData: {
  name: string;
  type: "receita" | "despesa";
  color: string | null;
}): Promise<{ error?: string }> {
  const parsed = categorySchema.safeParse({ ...formData, icon: null });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: tenant } = await supabase.from("tenants").select("id").maybeSingle();
  if (!tenant) return { error: "Tenant nao encontrado" };

  const { error } = await supabase.from("categories").insert({
    ...parsed.data,
    tenant_id: tenant.id,
    is_default: false,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/categorias");
  return {};
}

export async function updateCategory(
  id: string,
  formData: { name: string; type: "receita" | "despesa"; color: string | null },
): Promise<{ error?: string }> {
  const parsed = categorySchema.safeParse({ ...formData, icon: null });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("categories").update(parsed.data).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/categorias");
  return {};
}

export async function deleteCategory(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/categorias");
  return {};
}

// ===== Tenant =====

export async function updateTenant(formData: {
  name: string;
  document: string;
  trade_name: string | null;
  phone: string | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update(formData)
    .eq("user_id", (await supabase.auth.getUser()).data.user!.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/configuracoes");
  return {};
}
