"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import {
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "@/lib/supabase/appointments-actions";
import { Plus, Pencil, Trash2, Check, X, CalendarDays, MessageSquare, Globe } from "lucide-react";
import type { AppointmentRow } from "./page";

type Props = {
  appointments: AppointmentRow[];
};

type FormState = {
  id?: string;
  title: string;
  scheduled_at: string;
  notes: string;
};

function toInputDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatBR(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByScope(appointments: AppointmentRow[]) {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const hoje: AppointmentRow[] = [];
  const semana: AppointmentRow[] = [];
  const futuro: AppointmentRow[] = [];
  const passado: AppointmentRow[] = [];

  for (const apt of appointments) {
    const when = new Date(apt.scheduled_at);
    if (apt.status === "cancelado" || apt.status === "realizado" || when < now) {
      passado.push(apt);
    } else if (when <= endOfToday) {
      hoje.push(apt);
    } else if (when <= endOfWeek) {
      semana.push(apt);
    } else {
      futuro.push(apt);
    }
  }

  return { hoje, semana, futuro, passado };
}

export function AgendaClient({ appointments }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ title: "", scheduled_at: "", notes: "" });
  const [error, setError] = useState("");

  const groups = groupByScope(appointments);

  function openCreate() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    now.setMinutes(0, 0, 0);
    setForm({ title: "", scheduled_at: toInputDateTime(now.toISOString()), notes: "" });
    setError("");
    setFormOpen(true);
  }

  function openEdit(apt: AppointmentRow) {
    setForm({
      id: apt.id,
      title: apt.title,
      scheduled_at: toInputDateTime(apt.scheduled_at),
      notes: apt.notes ?? "",
    });
    setError("");
    setFormOpen(true);
  }

  async function handleSave() {
    setError("");
    if (!form.title.trim()) {
      setError("Informe o título do compromisso.");
      return;
    }
    if (!form.scheduled_at) {
      setError("Informe a data e hora.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      notes: form.notes.trim() || null,
    };

    const res = form.id
      ? await updateAppointment(form.id, payload)
      : await createAppointment(payload);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setFormOpen(false);
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este compromisso?")) return;
    const res = await deleteAppointment(id);
    if (res.ok) startTransition(() => router.refresh());
  }

  async function handleStatus(id: string, status: "realizado" | "cancelado" | "pendente") {
    const res = await updateAppointment(id, { status });
    if (res.ok) startTransition(() => router.refresh());
  }

  return (
    <>
      <AppHeader title="Agenda" description="Seus compromissos e lembretes.">
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Novo compromisso
        </Button>
      </AppHeader>

      <div className="p-6 space-y-6">
        {appointments.length === 0 && (
          <Card className="p-12 text-center">
            <CalendarDays className="h-10 w-10 mx-auto mb-3 text-slate-500" />
            <p className="text-sm text-slate-400">
              Sem compromissos cadastrados. Você pode criar pelo botão acima ou mandar um
              WhatsApp pro Guardinha: &quot;tenho médico amanhã às 16h&quot;.
            </p>
          </Card>
        )}

        {groups.hoje.length > 0 && (
          <Section title={`Hoje (${groups.hoje.length})`} appointments={groups.hoje} onEdit={openEdit} onDelete={handleDelete} onStatus={handleStatus} />
        )}
        {groups.semana.length > 0 && (
          <Section title={`Esta semana (${groups.semana.length})`} appointments={groups.semana} onEdit={openEdit} onDelete={handleDelete} onStatus={handleStatus} />
        )}
        {groups.futuro.length > 0 && (
          <Section title={`Futuros (${groups.futuro.length})`} appointments={groups.futuro} onEdit={openEdit} onDelete={handleDelete} onStatus={handleStatus} />
        )}
        {groups.passado.length > 0 && (
          <Section title={`Passados (${groups.passado.length})`} appointments={groups.passado} onEdit={openEdit} onDelete={handleDelete} onStatus={handleStatus} muted />
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={form.id ? "Editar compromisso" : "Novo compromisso"}>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Título</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Médico, Reunião com João, Aniversário da Ana..."
              maxLength={120}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Data e hora</label>
            <Input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Observações (opcional)</label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Local, motivo..."
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {form.id ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function Section({
  title,
  appointments,
  onEdit,
  onDelete,
  onStatus,
  muted = false,
}: {
  title: string;
  appointments: AppointmentRow[];
  onEdit: (apt: AppointmentRow) => void;
  onDelete: (id: string) => void;
  onStatus: (id: string, status: "realizado" | "cancelado" | "pendente") => void;
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">{title}</h2>
      <div className="space-y-2">
        {appointments.map((apt) => (
          <Card key={apt.id} className={`p-4 ${muted ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium truncate">{apt.title}</h3>
                  {apt.status === "realizado" && <Badge variant="success">Realizado</Badge>}
                  {apt.status === "cancelado" && <Badge variant="default">Cancelado</Badge>}
                  {apt.source === "whatsapp" ? (
                    <MessageSquare className="h-3 w-3 text-emerald-400" aria-label="WhatsApp" />
                  ) : (
                    <Globe className="h-3 w-3 text-slate-500" aria-label="Web" />
                  )}
                </div>
                <p className="text-sm text-slate-400">{formatBR(apt.scheduled_at)}</p>
                {apt.notes && <p className="text-xs text-slate-500 mt-1">{apt.notes}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {apt.status === "pendente" && (
                  <button
                    onClick={() => onStatus(apt.id, "realizado")}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors"
                    title="Marcar como realizado"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                {apt.status === "pendente" && (
                  <button
                    onClick={() => onStatus(apt.id, "cancelado")}
                    className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                    title="Cancelar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => onEdit(apt)}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(apt.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
