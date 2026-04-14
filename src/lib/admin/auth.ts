import { generateSecret, generateURI, verify } from "otplib";
import crypto from "crypto";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;

export type AdminContext = {
  userId: string;
  email: string;
  role: "super_admin";
  totpEnabled: boolean;
};

/**
 * Verifica se o usuário logado é admin.
 * Usa o client com session (não service).
 */
export async function getCurrentAdmin(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // admin_users só lê via service role (RLS estrita)
  const service = await createServiceClient();
  const { data } = await service
    .from("admin_users")
    .select("role, totp_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    role: data.role as "super_admin",
    totpEnabled: data.totp_enabled ?? false,
  };
}

/**
 * Checa se um usuário é admin (apenas booleano).
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const service = await createServiceClient();
  const { data } = await service
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

// ============================================================
// TOTP (2FA)
// ============================================================

/**
 * Gera secret TOTP novo (base32, 20 bytes = 32 chars base32).
 */
export async function generateTOTPSecret(): Promise<string> {
  return await generateSecret({ length: 20 });
}

/**
 * Gera URL otpauth:// para QR code (abrir com Google Authenticator).
 */
export function generateTOTPUri(secret: string, email: string): string {
  return generateURI({
    secret,
    label: email,
    issuer: "Guarda Dinheiro Admin",
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
  });
}

/**
 * Verifica código TOTP de 6 dígitos (tolerância de ±1 janela de 30s).
 */
export async function verifyTOTP(token: string, secret: string): Promise<boolean> {
  try {
    const result = await verify({
      token,
      secret,
      digits: TOTP_DIGITS,
      period: TOTP_PERIOD,
    });
    return result.valid === true;
  } catch {
    return false;
  }
}

/**
 * Gera 8 códigos de recuperação (8 chars alfanuméricos cada).
 */
export function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}

/**
 * Valida se código de recuperação está na lista e o remove (uso único).
 * Retorna true se o código foi válido e consumido.
 */
export async function consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
  const service = await createServiceClient();
  const { data } = await service
    .from("admin_users")
    .select("recovery_codes")
    .eq("user_id", userId)
    .maybeSingle();

  const codes = data?.recovery_codes ?? [];
  const idx = codes.findIndex((c) => c.toUpperCase() === code.toUpperCase());
  if (idx < 0) return false;

  const remaining = codes.filter((_, i) => i !== idx);
  await service.from("admin_users").update({ recovery_codes: remaining }).eq("user_id", userId);
  return true;
}

// ============================================================
// Audit log
// ============================================================

export type AuditLogEntry = {
  adminUserId: string;
  action: string;
  targetTenantId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  try {
    const service = await createServiceClient();
    await service.from("admin_audit_log").insert({
      admin_user_id: entry.adminUserId,
      action: entry.action,
      target_tenant_id: entry.targetTenantId ?? null,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      details: (entry.details ?? null) as import("@/types/supabase").Json,
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
    });
  } catch (err) {
    console.error("[admin-audit] Falha ao logar ação:", err);
  }
}
