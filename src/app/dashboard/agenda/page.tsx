import { createClient } from "@/lib/supabase/server";
import { AgendaClient } from "./client";

export const dynamic = "force-dynamic";

export type AppointmentRow = {
  id: string;
  title: string;
  notes: string | null;
  scheduled_at: string;
  status: "pendente" | "realizado" | "cancelado";
  source: "web" | "whatsapp";
  created_at: string;
};

export default async function AgendaPage() {
  const supabase = await createClient();

  const { data: tenant } = await supabase.from("tenants").select("id").maybeSingle();
  if (!tenant) {
    return <AgendaClient appointments={[]} />;
  }

  const { data } = await supabase
    .from("appointments")
    .select("id, title, notes, scheduled_at, status, source, created_at")
    .eq("tenant_id", tenant.id)
    .order("scheduled_at", { ascending: true })
    .limit(200);

  return <AgendaClient appointments={(data ?? []) as AppointmentRow[]} />;
}
