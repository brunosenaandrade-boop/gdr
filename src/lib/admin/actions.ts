"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  getCurrentAdmin,
  verifyTOTP,
  consumeRecoveryCode,
  logAdminAction,
  generateTOTPSecret,
  generateTOTPUri,
  generateRecoveryCodes,
} from "./auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp/meta-api";

type ActionResult = { ok: true } | { ok: false; error: string };

async function getIPFromRequest(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  } catch {
    return null;
  }
}

async function getUAFromRequest(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("user-agent") ?? null;
  } catch {
    return null;
  }
}

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Unauthorized");
  return admin;
}

// ============================================================
// Login + 2FA
// ============================================================

export async function adminSignIn(email: string, password: string): Promise<
  { ok: true; requires2FA: boolean; userId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { ok: false, error: "Credenciais inválidas" };
  }

  const service = await createServiceClient();
  const { data: adminRow } = await service
    .from("admin_users")
    .select("totp_enabled")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!adminRow) {
    await supabase.auth.signOut();
    return { ok: false, error: "Acesso negado. Você não é administrador." };
  }

  return {
    ok: true,
    requires2FA: adminRow.totp_enabled === true,
    userId: data.user.id,
  };
}

export async function adminVerify2FA(userId: string, code: string): Promise<ActionResult> {
  const service = await createServiceClient();
  const { data: adminRow } = await service
    .from("admin_users")
    .select("totp_secret, recovery_codes")
    .eq("user_id", userId)
    .maybeSingle();

  if (!adminRow?.totp_secret) {
    return { ok: false, error: "2FA não configurado" };
  }

  // Tenta TOTP primeiro
  const isTOTPValid = await verifyTOTP(code, adminRow.totp_secret);
  let valid = isTOTPValid;

  // Se não é TOTP, tenta código de recuperação
  if (!valid) {
    valid = await consumeRecoveryCode(userId, code);
  }

  if (!valid) {
    return { ok: false, error: "Código inválido" };
  }

  // Atualizar último login
  await service
    .from("admin_users")
    .update({
      last_login_at: new Date().toISOString(),
      last_login_ip: await getIPFromRequest(),
    })
    .eq("user_id", userId);

  await logAdminAction({
    adminUserId: userId,
    action: "admin.login",
    ipAddress: await getIPFromRequest(),
    userAgent: await getUAFromRequest(),
  });

  return { ok: true };
}

export async function adminSignOut(): Promise<void> {
  const admin = await getCurrentAdmin();
  const supabase = await createClient();
  await supabase.auth.signOut();
  if (admin) {
    await logAdminAction({
      adminUserId: admin.userId,
      action: "admin.logout",
      ipAddress: await getIPFromRequest(),
    });
  }
}

// ============================================================
// 2FA setup (primeiro acesso)
// ============================================================

export async function admin2FASetupStart(): Promise<
  { ok: true; secret: string; otpauthUri: string } | { ok: false; error: string }
> {
  const admin = await requireAdmin();
  if (admin.totpEnabled) {
    return { ok: false, error: "2FA já está ativo" };
  }

  const secret = await generateTOTPSecret();
  const otpauthUri = generateTOTPUri(secret, admin.email);

  // Armazena temporariamente (confirma no próximo step)
  const service = await createServiceClient();
  await service
    .from("admin_users")
    .update({ totp_secret: secret, totp_enabled: false })
    .eq("user_id", admin.userId);

  return { ok: true, secret, otpauthUri };
}

export async function admin2FASetupConfirm(
  code: string,
): Promise<{ ok: true; recoveryCodes: string[] } | { ok: false; error: string }> {
  const admin = await requireAdmin();

  const service = await createServiceClient();
  const { data } = await service
    .from("admin_users")
    .select("totp_secret")
    .eq("user_id", admin.userId)
    .maybeSingle();

  if (!data?.totp_secret) {
    return { ok: false, error: "Configure o 2FA primeiro" };
  }

  if (!(await verifyTOTP(code, data.totp_secret))) {
    return { ok: false, error: "Código inválido" };
  }

  const recoveryCodes = generateRecoveryCodes();
  await service
    .from("admin_users")
    .update({ totp_enabled: true, recovery_codes: recoveryCodes })
    .eq("user_id", admin.userId);

  await logAdminAction({
    adminUserId: admin.userId,
    action: "admin.2fa_enabled",
    ipAddress: await getIPFromRequest(),
  });

  return { ok: true, recoveryCodes };
}

// ============================================================
// Gerenciamento de tenants
// ============================================================

export async function suspendTenant(tenantId: string, reason: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const service = await createServiceClient();

  const { error } = await service.from("user_rate_limits").upsert({
    tenant_id: tenantId,
    blocked: true,
    blocked_reason: reason,
    blocked_at: new Date().toISOString(),
    blocked_by: admin.userId,
  }, { onConflict: "tenant_id" });

  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    adminUserId: admin.userId,
    action: "tenant.suspend",
    targetTenantId: tenantId,
    targetType: "tenant",
    targetId: tenantId,
    details: { reason },
    ipAddress: await getIPFromRequest(),
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function unsuspendTenant(tenantId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const service = await createServiceClient();

  const { error } = await service
    .from("user_rate_limits")
    .update({
      blocked: false,
      blocked_reason: null,
      blocked_at: null,
      blocked_by: null,
    })
    .eq("tenant_id", tenantId);

  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    adminUserId: admin.userId,
    action: "tenant.unsuspend",
    targetTenantId: tenantId,
    targetType: "tenant",
    targetId: tenantId,
    ipAddress: await getIPFromRequest(),
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setRateLimit(
  tenantId: string,
  limits: {
    max_messages_per_day?: number;
    max_audio_seconds_per_day?: number;
    ai_cost_limit_cents_per_day?: number;
  },
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const service = await createServiceClient();

  const { error } = await service.from("user_rate_limits").upsert({
    tenant_id: tenantId,
    ...limits,
    updated_at: new Date().toISOString(),
  }, { onConflict: "tenant_id" });

  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    adminUserId: admin.userId,
    action: "tenant.rate_limit_set",
    targetTenantId: tenantId,
    targetType: "tenant",
    targetId: tenantId,
    details: limits,
    ipAddress: await getIPFromRequest(),
  });

  revalidatePath(`/admin/users/${tenantId}`);
  return { ok: true };
}

export async function forceRenewSubscription(
  tenantId: string,
  months: number,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const service = await createServiceClient();

  const { data: sub } = await service
    .from("subscriptions")
    .select("current_period_end")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const base = sub?.current_period_end && new Date(sub.current_period_end) > new Date()
    ? new Date(sub.current_period_end)
    : new Date();
  const newEnd = new Date(base);
  newEnd.setMonth(newEnd.getMonth() + months);

  const { error } = await service.from("subscriptions").upsert({
    tenant_id: tenantId,
    status: "active",
    current_period_end: newEnd.toISOString(),
    canceled_at: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "tenant_id" });

  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    adminUserId: admin.userId,
    action: "subscription.force_renew",
    targetTenantId: tenantId,
    targetType: "subscription",
    targetId: tenantId,
    details: { months, newPeriodEnd: newEnd.toISOString() },
    ipAddress: await getIPFromRequest(),
  });

  revalidatePath(`/admin/users/${tenantId}`);
  return { ok: true };
}

export async function sendDirectMessage(
  tenantId: string,
  message: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const service = await createServiceClient();

  const { data: link } = await service
    .from("whatsapp_links")
    .select("phone_number")
    .eq("tenant_id", tenantId)
    .eq("verified", true)
    .maybeSingle();

  if (!link?.phone_number) {
    return { ok: false, error: "Usuário sem WhatsApp vinculado" };
  }

  const result = await sendWhatsAppMessage(link.phone_number, message);
  if (!result.ok) return { ok: false, error: result.error };

  await logAdminAction({
    adminUserId: admin.userId,
    action: "admin.direct_message",
    targetTenantId: tenantId,
    targetType: "tenant",
    targetId: tenantId,
    details: { phone: link.phone_number, preview: message.slice(0, 100) },
    ipAddress: await getIPFromRequest(),
  });

  return { ok: true };
}
