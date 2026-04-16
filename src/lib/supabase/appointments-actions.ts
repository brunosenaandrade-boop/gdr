"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "./server";

const appointmentSchema = z.object({
  title: z.string().min(2, "Título muito curto").max(120),
  scheduled_at: z.string().min(1, "Data obrigatória"),
  notes: z.string().nullable().optional(),
  status: z.enum(["pendente", "realizado", "cancelado"]).optional(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

export async function createAppointment(
  input: AppointmentInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const scheduledDate = new Date(parsed.data.scheduled_at);
  if (isNaN(scheduledDate.getTime())) {
    return { ok: false, error: "Data inválida" };
  }

  try {
    const supabase = await createClient();
    const { data: tenant } = await supabase.from("tenants").select("id").maybeSingle();
    if (!tenant) return { ok: false, error: "Tenant não encontrado" };

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        tenant_id: tenant.id,
        title: parsed.data.title,
        scheduled_at: scheduledDate.toISOString(),
        notes: parsed.data.notes ?? null,
        status: parsed.data.status ?? "pendente",
        source: "web",
      })
      .select("id")
      .maybeSingle();

    if (error || !data) {
      Sentry.captureException(error);
      return { ok: false, error: "Erro ao criar compromisso" };
    }

    revalidatePath("/dashboard/agenda");
    return { ok: true, id: data.id };
  } catch (err) {
    Sentry.captureException(err);
    return { ok: false, error: "Erro interno" };
  }
}

export async function updateAppointment(
  id: string,
  input: Partial<AppointmentInput>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const { data: tenant } = await supabase.from("tenants").select("id").maybeSingle();
    if (!tenant) return { ok: false, error: "Tenant não encontrado" };

    const updates: {
      title?: string;
      scheduled_at?: string;
      notes?: string | null;
      status?: "pendente" | "realizado" | "cancelado";
    } = {};

    if (input.title !== undefined) updates.title = input.title;
    if (input.scheduled_at !== undefined) {
      const d = new Date(input.scheduled_at);
      if (isNaN(d.getTime())) return { ok: false, error: "Data inválida" };
      updates.scheduled_at = d.toISOString();
    }
    if (input.notes !== undefined) updates.notes = input.notes;
    if (input.status !== undefined) updates.status = input.status;

    const { error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", tenant.id);

    if (error) {
      Sentry.captureException(error);
      return { ok: false, error: "Erro ao atualizar compromisso" };
    }

    revalidatePath("/dashboard/agenda");
    return { ok: true };
  } catch (err) {
    Sentry.captureException(err);
    return { ok: false, error: "Erro interno" };
  }
}

export async function deleteAppointment(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const { data: tenant } = await supabase.from("tenants").select("id").maybeSingle();
    if (!tenant) return { ok: false, error: "Tenant não encontrado" };

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenant.id);

    if (error) {
      Sentry.captureException(error);
      return { ok: false, error: "Erro ao excluir compromisso" };
    }

    revalidatePath("/dashboard/agenda");
    return { ok: true };
  } catch (err) {
    Sentry.captureException(err);
    return { ok: false, error: "Erro interno" };
  }
}
