"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { markSaleAsPaid } from "@/lib/affiliates/admin-actions";
import { Copy, CheckCheck } from "lucide-react";

type Sale = {
  id: string;
  saleAmountCents: number;
  commissionAmountCents: number;
  couponCode: string | null;
  attributionSource: string;
  hotmartTransaction: string | null;
  createdAt: string;
};

type Group = {
  affiliateId: string;
  name: string;
  email: string;
  pixKey: string | null;
  phone: string | null;
  sales: Sale[];
  totalCommission: number;
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function PayoutsClient({
  groups,
  grandTotalCents,
}: { groups: Group[]; grandTotalCents: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function handleCopy(key: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function handleMarkPaid(saleId: string) {
    const method = prompt("Método de pagamento (ex: PIX):", "PIX");
    if (!method) return;
    const notes = prompt("Notas (opcional, ex: ID da transação PIX):");
    startTransition(async () => {
      const res = await markSaleAsPaid(saleId, method, notes ?? undefined);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleMarkAllPaid(saleIds: string[]) {
    if (!confirm(`Marcar ${saleIds.length} venda(s) como paga(s)?`)) return;
    const method = prompt("Método de pagamento (ex: PIX):", "PIX");
    if (!method) return;
    const notes = prompt("Notas (opcional):");
    startTransition(async () => {
      for (const id of saleIds) {
        const res = await markSaleAsPaid(id, method, notes ?? undefined);
        if (!res.ok) {
          setError(`Erro ao marcar ${id}: ${res.error}`);
          return;
        }
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pagamentos pendentes</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {groups.length} afiliados · {formatCurrency(grandTotalCents)} a pagar
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300">
          {error}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center text-zinc-500">
          🎉 Nenhuma comissão pendente.
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.affiliateId} className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/affiliates/${g.affiliateId}`}
                    className="font-semibold hover:text-red-400"
                  >
                    {g.name}
                  </Link>
                  <span className="text-xs text-zinc-500">{g.email}</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-sm">
                  <div>
                    <span className="text-zinc-500 text-xs">PIX: </span>
                    {g.pixKey ? (
                      <code className="font-mono text-xs">{g.pixKey}</code>
                    ) : (
                      <span className="text-amber-400 text-xs">Não cadastrado</span>
                    )}
                  </div>
                  {g.pixKey && (
                    <button
                      onClick={() => handleCopy(`pix-${g.affiliateId}`, g.pixKey!)}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      {copiedKey === `pix-${g.affiliateId}` ? (
                        <CheckCheck className="h-3 w-3 inline text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3 inline" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(g.totalCommission)}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {g.sales.length} venda{g.sales.length !== 1 ? "s" : ""}
                </div>
                <button
                  onClick={() => handleMarkAllPaid(g.sales.map((s) => s.id))}
                  disabled={pending || !g.pixKey}
                  className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium rounded"
                >
                  Marcar tudo pago
                </button>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-zinc-900/50 text-xs text-zinc-400 uppercase">
                <tr>
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Origem</th>
                  <th className="text-left p-3">Cupom</th>
                  <th className="text-left p-3">TX Hotmart</th>
                  <th className="text-right p-3">Venda</th>
                  <th className="text-right p-3">Comissão</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {g.sales.map((s) => (
                  <tr key={s.id} className="border-t border-zinc-800">
                    <td className="p-3 text-xs text-zinc-400">{formatDate(s.createdAt)}</td>
                    <td className="p-3 text-xs">{s.attributionSource}</td>
                    <td className="p-3 text-xs font-mono">{s.couponCode ?? "—"}</td>
                    <td className="p-3 text-xs font-mono text-zinc-500">{s.hotmartTransaction ?? "—"}</td>
                    <td className="p-3 text-right text-xs font-mono">
                      {formatCurrency(s.saleAmountCents)}
                    </td>
                    <td className="p-3 text-right text-xs font-mono text-emerald-300">
                      {formatCurrency(s.commissionAmountCents)}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleMarkPaid(s.id)}
                        disabled={pending}
                        className="text-xs text-emerald-400 hover:text-emerald-300"
                      >
                        Marcar pago
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
