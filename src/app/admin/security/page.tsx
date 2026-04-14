import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getCurrentAdmin } from "@/lib/admin/auth";
import { AdminShell } from "../layout";
import { SecurityClient } from "./client";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminSecurityPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  // Se já tem 2FA ativo, não precisa fazer setup de novo
  let qrDataUri: string | null = null;
  let secret: string | null = null;

  if (!admin.totpEnabled) {
    // Gera secret automaticamente no primeiro carregamento
    const { admin2FASetupStart } = await import("@/lib/admin/actions");
    const res = await admin2FASetupStart();
    if (res.ok) {
      secret = res.secret;
      qrDataUri = await QRCode.toDataURL(res.otpauthUri, {
        width: 256,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    }
  }

  // Buscar último login + recovery codes count
  const service = await createServiceClient();
  const { data: row } = await service
    .from("admin_users")
    .select("last_login_at, last_login_ip, recovery_codes")
    .eq("user_id", admin.userId)
    .maybeSingle();

  return (
    <AdminShell>
      <SecurityClient
        email={admin.email}
        totpEnabled={admin.totpEnabled}
        qrDataUri={qrDataUri}
        secret={secret}
        lastLoginAt={row?.last_login_at ?? null}
        lastLoginIp={row?.last_login_ip ? String(row.last_login_ip) : null}
        recoveryCodesCount={row?.recovery_codes?.length ?? 0}
      />
    </AdminShell>
  );
}
