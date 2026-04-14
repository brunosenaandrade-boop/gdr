"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  suspendTenant,
  unsuspendTenant,
  setRateLimit,
  forceRenewSubscription,
  sendDirectMessage,
} from "@/lib/admin/actions";

type Props = {
  tenantId: string;
  blocked: boolean;
  limits: {
    max_messages_per_day: number;
    max_audio_seconds_per_day: number;
    ai_cost_limit_cents_per_day: number;
  };
  hasPhone: boolean;
};

export function UserActions({ tenantId, blocked, limits, hasPhone }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSuspend() {
    const reason = prompt("Motivo da suspensão:");
    if (!reason) return;
    startTransition(async () => {
      const res = await suspendTenant(tenantId, reason);
      if (!res.ok) setError(res.error);
      else { setSuccess("Usuário suspenso"); router.refresh(); }
    });
  }

  async function handleUnsuspend() {
    startTransition(async () => {
      const res = await unsuspendTenant(tenantId);
      if (!res.ok) setError(res.error);
      else { setSuccess("Usuário reativado"); router.refresh(); }
    });
  }

  async function handleForceRenew() {
    const months = prompt("Quantos meses adicionar?", "1");
    if (!months) return;
    const n = parseInt(months, 10);
    if (isNaN(n) || n <= 0) return;
    startTransition(async () => {
      const res = await forceRenewSubscription(tenantId, n);
      if (!res.ok) setError(res.error);
      else { setSuccess(`Assinatura renovada por ${n} meses`); router.refresh(); }
    });
  }

  async function handleSendMessage() {
    const msg = prompt("Mensagem para enviar via WhatsApp:");
    if (!msg) return;
    startTransition(async () => {
      const res = await sendDirectMessage(tenantId, msg);
      if (!res.ok) setError(res.error);
      else setSuccess("Mensagem enviada");
    });
  }

  async function handleUpdateLimits(formData: FormData) {
    const newLimits = {
      max_messages_per_day: parseInt(formData.get("msg") as string, 10),
      max_audio_seconds_per_day: parseInt(formData.get("audio") as string, 10),
      ai_cost_limit_cents_per_day: parseInt(formData.get("cost") as string, 10),
    };
    startTransition(async () => {
      const res = await setRateLimit(tenantId, newLimits);
      if (!res.ok) setError(res.error);
      else { setSuccess("Limites atualizados"); router.refresh(); }
    });
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h2 className="text-sm font-medium text-zinc-300 mb-4">Ações</h2>

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
      {success && <p className="text-sm text-emerald-400 mb-3">{success}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Suspender */}
        <div>
          <h3 className="text-xs text-zinc-500 uppercase mb-2">Bloqueio</h3>
          {blocked ? (
            <button
              onClick={handleUnsuspend}
              disabled={pending}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
            >
              ✓ Reativar usuário
            </button>
          ) : (
            <button
              onClick={handleSuspend}
              disabled={pending}
              className="w-full py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
            >
              🚫 Suspender usuário
            </button>
          )}
        </div>

        {/* Forçar renovação */}
        <div>
          <h3 className="text-xs text-zinc-500 uppercase mb-2">Assinatura</h3>
          <button
            onClick={handleForceRenew}
            disabled={pending}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
          >
            🔄 Forçar renovação
          </button>
        </div>

        {/* Mensagem direta */}
        <div>
          <h3 className="text-xs text-zinc-500 uppercase mb-2">WhatsApp</h3>
          <button
            onClick={handleSendMessage}
            disabled={pending || !hasPhone}
            className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
          >
            💬 Enviar mensagem direta
          </button>
        </div>
      </div>

      {/* Rate limits */}
      <div className="mt-6">
        <h3 className="text-xs text-zinc-500 uppercase mb-2">Limites diários</h3>
        <form action={handleUpdateLimits} className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <label className="text-xs text-zinc-400">Mensagens/dia</label>
            <input
              name="msg"
              type="number"
              defaultValue={limits.max_messages_per_day}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Áudio seg/dia</label>
            <input
              name="audio"
              type="number"
              defaultValue={limits.max_audio_seconds_per_day}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Custo IA (cents)/dia</label>
            <input
              name="cost"
              type="number"
              defaultValue={limits.ai_cost_limit_cents_per_day}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm mt-1"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={pending}
              className="w-full py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-sm font-medium rounded"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
