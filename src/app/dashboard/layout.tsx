import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "./shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <DashboardShell userId={user.id} hasTenant={!!tenant}>
      {children}
    </DashboardShell>
  );
}
