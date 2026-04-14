"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentAdmin, logAdminAction } from "@/lib/admin/auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp/meta-api";

type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

async function getIP(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  } catch {
    return null;
  }
}

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Unauthorized");
  return admin;
}

function generateTempPassword(length = 16): string {
  // Removidos caracteres ambíguos visualmente:
  // 0/O/o, 1/l/I, 2/Z/z, 5/S/s, 8/B, 6/G, 9/g/q, vV, uU, wW
  const chars = "ACDEFHJKMNPRTXYabcdefhjkmnprtxy347";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

// ============================================================
// Afiliados
// ============================================================

export async function createAffiliate(input: {
  name: string;
  email: string;
  cpf_cnpj?: string | null;
  phone?: string | null;
  pix_key?: string | null;
  commission_rate?: number;
  hotmart_email?: string | null;
  hotmart_affiliate_code?: string | null;
  notes?: string | null;
}): Promise<ActionResult<{ affiliateId: string; tempPassword: string }>> {
  const admin = await requireAdmin();

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (name.length < 2) return { ok: false, error: "Nome muito curto" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Email inválido" };

  const service = await createServiceClient();

  // Checar duplicata
  const { data: existing } = await service
    .from("affiliates")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) return { ok: false, error: "Já existe afiliado com esse email" };

  // Criar user no Supabase Auth
  const tempPassword = generateTempPassword(12);
  const { data: authUser, error: authError } = await service.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: name, role: "affiliate" },
  });

  if (authError || !authUser?.user) {
    // Se o user já existe no auth (ex: era tenant), continua só criando affiliate vinculado
    const emailExists = authError?.message?.toLowerCase().includes("already");
    if (!emailExists) {
      return { ok: false, error: authError?.message ?? "Erro ao criar usuário" };
    }
  }

  const userId = authUser?.user?.id ?? null;

  // Criar afiliado
  const { data: affiliate, error } = await service
    .from("affiliates")
    .insert({
      user_id: userId,
      name,
      email,
      cpf_cnpj: input.cpf_cnpj?.replace(/\D/g, "") || null,
      phone: input.phone?.replace(/\D/g, "") || null,
      pix_key: input.pix_key || null,
      commission_rate: input.commission_rate ?? 40,
      hotmart_email: input.hotmart_email?.toLowerCase() || null,
      hotmart_affiliate_code: input.hotmart_affiliate_code || null,
      notes: input.notes || null,
      status: "active",
    })
    .select("id")
    .maybeSingle();

  if (error || !affiliate) {
    return { ok: false, error: error?.message ?? "Erro ao criar afiliado" };
  }

  await logAdminAction({
    adminUserId: admin.userId,
    action: "affiliate.create",
    targetType: "affiliate",
    targetId: affiliate.id,
    details: { name, email },
    ipAddress: await getIP(),
  });

  revalidatePath("/admin/affiliates");
  return { ok: true, data: { affiliateId: affiliate.id, tempPassword } };
}

export async function updateAffiliate(
  id: string,
  input: {
    name?: string;
    phone?: string | null;
    pix_key?: string | null;
    commission_rate?: number;
    hotmart_email?: string | null;
    hotmart_affiliate_code?: string | null;
    notes?: string | null;
  },
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const service = await createServiceClient();

  const updates: {
    name?: string;
    phone?: string | null;
    pix_key?: string | null;
    commission_rate?: number;
    hotmart_email?: string | null;
    hotmart_affiliate_code?: string | null;
    notes?: string | null;
  } = {};
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.phone !== undefined) updates.phone = input.phone?.replace(/\D/g, "") || null;
  if (input.pix_key !== undefined) updates.pix_key = input.pix_key || null;
  if (input.commission_rate !== undefined) updates.commission_rate = input.commission_rate;
  if (input.hotmart_email !== undefined) updates.hotmart_email = input.hotmart_email?.toLowerCase() || null;
  if (input.hotmart_affiliate_code !== undefined) updates.hotmart_affiliate_code = input.hotmart_affiliate_code || null;
  if (input.notes !== undefined) updates.notes = input.notes || null;

  const { error } = await service.from("affiliates").update(updates).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    adminUserId: admin.userId,
    action: "affiliate.update",
    targetType: "affiliate",
    targetId: id,
    details: updates,
    ipAddress: await getIP(),
  });

  revalidatePath(`/admin/affiliates/${id}`);
  revalidatePath("/admin/affiliates");
  return { ok: true };
}

export async function setAffiliateStatus(
  id: string,
  status: "active" | "suspended" | "blocked",
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const service = await createServiceClient();

  const { error } = await service.from("affiliates").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    adminUserId: admin.userId,
    action: `affiliate.status_${status}`,
    targetType: "affiliate",
    targetId: id,
    details: { status },
    ipAddress: await getIP(),
  });

  revalidatePath(`/admin/affiliates/${id}`);
  revalidatePath("/admin/affiliates");
  return { ok: true };
}

/**
 * Admin reseta a senha do afiliado e gera nova temporária.
 */
export async function resetAffiliatePassword(
  id: string,
): Promise<ActionResult<{ tempPassword: string; email: string }>> {
  const admin = await requireAdmin();
  const service = await createServiceClient();

  const { data: affiliate } = await service
    .from("affiliates")
    .select("user_id, email")
    .eq("id", id)
    .maybeSingle();

  if (!affiliate) return { ok: false, error: "Afiliado não encontrado" };
  if (!affiliate.user_id) return { ok: false, error: "Afiliado sem conta de auth" };

  const tempPassword = generateTempPassword(16);

  const { error } = await service.auth.admin.updateUserById(affiliate.user_id, {
    password: tempPassword,
  });
  if (error) return { ok: false, error: error.message };

  // Reativa a flag de troca obrigatória
  await service.from("affiliates").update({ must_change_password: true }).eq("id", id);

  await logAdminAction({
    adminUserId: admin.userId,
    action: "affiliate.password_reset",
    targetType: "affiliate",
    targetId: id,
    ipAddress: await getIP(),
  });

  return { ok: true, data: { tempPassword, email: affiliate.email } };
}

// ============================================================
// Cupons
// ============================================================

export async function createCoupon(input: {
  code: string;
  affiliate_id?: string | null;
  discount_pct?: number;
  max_uses?: number | null;
  valid_until?: string | null;
  description?: string | null;
}): Promise<ActionResult> {
  const admin = await requireAdmin();

  // Sanitizar e validar código
  const code = input.code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (code.length < 3 || code.length > 30) {
    return { ok: false, error: "Código deve ter 3-30 caracteres alfanuméricos" };
  }
  const discount = input.discount_pct ?? 0;
  if (discount < 0 || discount > 50) {
    return { ok: false, error: "Desconto deve estar entre 0 e 50%" };
  }

  const service = await createServiceClient();

  const { error } = await service.from("coupons").insert({
    code,
    affiliate_id: input.affiliate_id || null,
    discount_pct: discount,
    max_uses: input.max_uses || null,
    valid_until: input.valid_until || null,
    description: input.description || null,
    active: true,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Código já existe" };
    return { ok: false, error: error.message };
  }

  await logAdminAction({
    adminUserId: admin.userId,
    action: "coupon.create",
    targetType: "coupon",
    targetId: code,
    details: { discount, affiliate_id: input.affiliate_id },
    ipAddress: await getIP(),
  });

  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function toggleCouponActive(code: string, active: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  const service = await createServiceClient();

  const { error } = await service.from("coupons").update({ active }).eq("code", code);
  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    adminUserId: admin.userId,
    action: active ? "coupon.activate" : "coupon.deactivate",
    targetType: "coupon",
    targetId: code,
    ipAddress: await getIP(),
  });

  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function deleteCoupon(code: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const service = await createServiceClient();

  const { error } = await service.from("coupons").delete().eq("code", code);
  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    adminUserId: admin.userId,
    action: "coupon.delete",
    targetType: "coupon",
    targetId: code,
    ipAddress: await getIP(),
  });

  revalidatePath("/admin/coupons");
  return { ok: true };
}

// ============================================================
// Affiliate sales (marcar como paga)
// ============================================================

export async function markSaleAsPaid(
  saleId: string,
  method: string,
  notes?: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const service = await createServiceClient();

  const { data: sale } = await service
    .from("affiliate_sales")
    .select("id, affiliate_id, status, commission_amount_cents, affiliates(name, phone)")
    .eq("id", saleId)
    .maybeSingle();

  if (!sale) return { ok: false, error: "Venda não encontrada" };
  if (sale.status !== "pending") return { ok: false, error: "Venda não está pendente" };

  const { error } = await service
    .from("affiliate_sales")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      paid_by: admin.userId,
      paid_method: method,
      paid_notes: notes || null,
    })
    .eq("id", saleId);

  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    adminUserId: admin.userId,
    action: "affiliate_sale.paid",
    targetType: "affiliate_sale",
    targetId: saleId,
    details: { method, amount_cents: sale.commission_amount_cents },
    ipAddress: await getIP(),
  });

  // Notificar afiliado via WhatsApp se tiver número
  const affiliate = Array.isArray(sale.affiliates) ? sale.affiliates[0] : sale.affiliates;
  if (affiliate?.phone) {
    const amount = (sale.commission_amount_cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    await sendWhatsAppMessage(
      affiliate.phone,
      `💚 Sua comissão de ${amount} foi paga!\n\nMétodo: ${method}\n\nAcesse ${process.env.AFFILIATE_DOMAIN ?? "afiliado.guardadinheiro.com.br"} pra ver os detalhes.`,
    );
  }

  revalidatePath("/admin/affiliates");
  return { ok: true };
}
