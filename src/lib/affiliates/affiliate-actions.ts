"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCurrentAffiliate } from "./auth";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function signInAffiliate(
  email: string,
  password: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: "Email ou senha incorretos" };
  return { ok: true };
}

export async function signOutAffiliate(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/**
 * Afiliado troca a própria senha (já logado).
 * Marca must_change_password = false após troca bem-sucedida.
 */
export async function changeAffiliatePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<ActionResult> {
  if (newPassword.length < 8) {
    return { ok: false, error: "Nova senha precisa ter pelo menos 8 caracteres" };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "Senhas não conferem" };
  }
  if (newPassword === currentPassword) {
    return { ok: false, error: "Nova senha deve ser diferente da atual" };
  }

  const affiliate = await getCurrentAffiliate();
  if (!affiliate) return { ok: false, error: "Não autenticado" };

  const supabase = await createClient();

  // Revalida senha atual
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: affiliate.email,
    password: currentPassword,
  });
  if (signInError) return { ok: false, error: "Senha atual incorreta" };

  // Atualiza
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };

  // Marca flag de must_change_password = false
  const service = await createServiceClient();
  await service
    .from("affiliates")
    .update({ must_change_password: false })
    .eq("id", affiliate.affiliateId);

  revalidatePath("/afiliado");
  revalidatePath("/afiliado/conta");
  return { ok: true };
}

/**
 * Afiliado atualiza dados do próprio perfil.
 * Não permite alterar email, comissão ou status — só admin pode.
 */
export async function updateAffiliateProfile(input: {
  name?: string;
  phone?: string | null;
  pix_key?: string | null;
  cpf_cnpj?: string | null;
  hotmart_email?: string | null;
}): Promise<ActionResult> {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) return { ok: false, error: "Não autenticado" };

  const updates: {
    name?: string;
    phone?: string | null;
    pix_key?: string | null;
    cpf_cnpj?: string | null;
    hotmart_email?: string | null;
  } = {};

  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (trimmed.length < 2) return { ok: false, error: "Nome muito curto" };
    updates.name = trimmed;
  }
  if (input.phone !== undefined) updates.phone = input.phone?.replace(/\D/g, "") || null;
  if (input.pix_key !== undefined) updates.pix_key = input.pix_key?.trim() || null;
  if (input.cpf_cnpj !== undefined) updates.cpf_cnpj = input.cpf_cnpj?.replace(/\D/g, "") || null;
  if (input.hotmart_email !== undefined) {
    const email = input.hotmart_email?.trim().toLowerCase() || null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: "Email Hotmart inválido" };
    }
    updates.hotmart_email = email;
  }

  const service = await createServiceClient();
  const { error } = await service
    .from("affiliates")
    .update(updates)
    .eq("id", affiliate.affiliateId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/afiliado/conta");
  return { ok: true };
}

/**
 * Solicita link de recuperação de senha por email.
 * Envia email com Supabase Auth, redirecionando pra /afiliado/redefinir-senha.
 */
export async function requestAffiliatePasswordReset(
  email: string,
  origin: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/afiliado/redefinir-senha`,
  });
  if (error) return { ok: false, error: "Não foi possível enviar o email" };
  return { ok: true };
}

/**
 * Redefine senha após clicar no link do email.
 * O Supabase já estabelece sessão temporária via token na URL,
 * então só atualizamos o password.
 */
export async function resetAffiliatePassword(
  newPassword: string,
  confirmPassword: string,
): Promise<ActionResult> {
  if (newPassword.length < 8) {
    return { ok: false, error: "Nova senha precisa ter pelo menos 8 caracteres" };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "Senhas não conferem" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };

  // Marca must_change_password = false se for afiliado
  const affiliate = await getCurrentAffiliate();
  if (affiliate) {
    const service = await createServiceClient();
    await service
      .from("affiliates")
      .update({ must_change_password: false })
      .eq("id", affiliate.affiliateId);
  }

  return { ok: true };
}
