import { getTenant } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { ConfiguracoesClient, type SubscriptionInfo } from "./client";
import { redirect } from "next/navigation";

export default async function ConfiguracoesPage() {
  const tenant = await getTenant();
  if (!tenant) redirect("/dashboard");

  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, plan_type, current_period_end, canceled_at, gateway")
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  const subscription: SubscriptionInfo | null = sub
    ? {
        status: sub.status,
        planType: sub.plan_type,
        currentPeriodEnd: sub.current_period_end,
        canceledAt: sub.canceled_at,
        gateway: sub.gateway,
      }
    : null;

  return <ConfiguracoesClient tenant={tenant} subscription={subscription} />;
}
