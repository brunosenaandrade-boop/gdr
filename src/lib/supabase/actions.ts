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
  const { todayBRT } = await import("@/lib/date/brt");
  const today = todayBRT();
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
  revalidatePath("/dashboard/contas-pagar");
  return {};
}

export async function postponeTransaction(id: string, newDueDate: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({ due_date: newDueDate, status: "pendente", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    Sentry.captureException(error);
    return { error: "Erro ao adiar. Tente novamente." };
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/contas-pagar");
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

  // Email de segurança: senha alterada
  try {
    const { sendEmail } = await import("@/lib/email/resend");
    const { PasswordChangedEmail } = await import("@/lib/email/templates/password-changed");
    await sendEmail({
      to: user.email!,
      subject: "Senha alterada - Guarda Dinheiro",
      react: PasswordChangedEmail({
        email: user.email!,
        changedAt: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      }),
      tags: [{ name: "category", value: "password-changed" }],
    });
  } catch (err) {
    console.error("changePassword email error:", err);
  }

  return { success: "Senha alterada com sucesso!" };
}

// ===== Delete Account (LGPD) =====

export async function deleteAccount(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Não autenticado" };

    const { data: tenant } = await supabase.from("tenants").select("id").maybeSingle();
    if (!tenant) return { ok: false, error: "Tenant não encontrado" };

    const { createServiceClient } = await import("./server");
    const service = await createServiceClient();

    // Deletar dados do tenant (CASCADE cuida das FKs)
    await service.from("financial_scores").delete().eq("tenant_id", tenant.id);
    await service.from("appointments").delete().eq("tenant_id", tenant.id);
    await service.from("whatsapp_pending").delete().eq("tenant_id", tenant.id);
    await service.from("whatsapp_conversation_log").delete().eq("tenant_id", tenant.id);
    await service.from("whatsapp_links").delete().eq("tenant_id", tenant.id);
    await service.from("transactions").delete().eq("tenant_id", tenant.id);
    await service.from("recurring_transactions").delete().eq("tenant_id", tenant.id);
    await service.from("categories").delete().eq("tenant_id", tenant.id);
    await service.from("subscriptions").delete().eq("tenant_id", tenant.id);
    await service.from("user_rate_limits").delete().eq("tenant_id", tenant.id);
    await service.from("ai_usage").delete().eq("tenant_id", tenant.id);
    await service.from("tenants").delete().eq("id", tenant.id);

    // Deletar auth user
    await service.auth.admin.deleteUser(user.id);

    // Email LGPD: confirmação de exclusão (antes do signOut)
    if (user.email) {
      try {
        const { sendEmail } = await import("@/lib/email/resend");
        const { AccountDeletedEmail } = await import("@/lib/email/templates/account-deleted");
        await sendEmail({
          to: user.email,
          subject: "Conta excluida - Guarda Dinheiro",
          react: AccountDeletedEmail({
            name: user.user_metadata?.full_name ?? null,
            email: user.email,
          }),
          tags: [{ name: "category", value: "account-deleted" }],
        });
      } catch (err) {
        console.error("deleteAccount email error:", err);
      }
    }

    // Logout
    await supabase.auth.signOut();

    return { ok: true };
  } catch (err) {
    Sentry.captureException(err);
    return { ok: false, error: "Erro ao excluir conta. Entre em contato com o suporte." };
  }
}
