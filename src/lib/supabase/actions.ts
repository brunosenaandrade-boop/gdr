"use server";

import * as Sentry from "@sentry/nextjs";
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
  if (!tenant) return { error: "Tenant não encontrado" };

  const { error } = await supabase.from("transactions").insert({
    ...parsed.data,
    tenant_id: tenant.id,
    source: "web",
  });

  if (error) {
    Sentry.captureException(error);
    console.error("createTransaction DB error:", error.message);
    return { error: "Ocorreu um erro. Tente novamente." };
  }
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

  if (error) {
    Sentry.captureException(error);
    console.error("updateTransaction DB error:", error.message);
    return { error: "Ocorreu um erro. Tente novamente." };
  }
  revalidatePath("/dashboard");
  return {};
}

export async function deleteTransaction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) {
    Sentry.captureException(error);
    console.error("deleteTransaction DB error:", error.message);
    return { error: "Ocorreu um erro. Tente novamente." };
  }
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

  if (error) {
    Sentry.captureException(error);
    console.error("markTransactionPaid DB error:", error.message);
    return { error: "Ocorreu um erro. Tente novamente." };
  }
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
  if (!tenant) return { error: "Tenant não encontrado" };

  const { error } = await supabase.from("categories").insert({
    ...parsed.data,
    tenant_id: tenant.id,
    is_default: false,
  });

  if (error) {
    Sentry.captureException(error);
    console.error("createCategory DB error:", error.message);
    return { error: "Ocorreu um erro. Tente novamente." };
  }
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

  if (error) {
    Sentry.captureException(error);
    console.error("updateCategory DB error:", error.message);
    return { error: "Ocorreu um erro. Tente novamente." };
  }
  revalidatePath("/dashboard/categorias");
  return {};
}

export async function deleteCategory(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    Sentry.captureException(error);
    console.error("deleteCategory DB error:", error.message);
    return { error: "Ocorreu um erro. Tente novamente." };
  }
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("tenants")
    .update(formData)
    .eq("user_id", user.id);

  if (error) {
    Sentry.captureException(error);
    console.error("updateTenant DB error:", error.message);
    return { error: "Ocorreu um erro. Tente novamente." };
  }
  revalidatePath("/dashboard/configuracoes");
  return {};
}

// ===== Password =====

/**
 * Altera a senha do usuário logado.
 * Exige senha atual (revalidada via Supabase Auth) + nova senha (mínimo 6 chars).
 */
export async function changePassword(formData: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ error?: string; success?: string }> {
  if (formData.newPassword.length < 6) {
    return { error: "A nova senha deve ter pelo menos 6 caracteres." };
  }
  if (formData.newPassword !== formData.confirmPassword) {
    return { error: "As senhas não conferem." };
  }
  if (formData.currentPassword === formData.newPassword) {
    return { error: "A nova senha deve ser diferente da atual." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Não autenticado." };

  // Revalida senha atual
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: formData.currentPassword,
  });

  if (signInError) {
    return { error: "Senha atual incorreta." };
  }

  const { error } = await supabase.auth.updateUser({
    password: formData.newPassword,
  });

  if (error) {
    Sentry.captureException(error);
    console.error("changePassword error:", error.message);
    return { error: "Não foi possível alterar a senha. Tente novamente." };
  }

  return { success: "Senha alterada com sucesso!" };
}
