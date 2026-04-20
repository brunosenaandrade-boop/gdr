"use client";

import { useState } from "react";
import { Gift, Loader2, Mail, X } from "lucide-react";

interface SubscribeFormProps {
  plan: "mensal" | "anual";
  planLabel: string;
  monthlyPrice: string;
  totalPrice: string;
  buttonClass: string;
  buttonLabel: string;
  showBump?: boolean;
}

export function SubscribeForm({
  plan,
  planLabel,
  monthlyPrice,
  totalPrice,
  buttonClass,
  buttonLabel,
  showBump = true,
}: SubscribeFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [addBump, setAddBump] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/subscriptions/preapproval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          email: email.trim().toLowerCase(),
          hasBump: addBump,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao processar. Tente novamente.");
        setLoading(false);
        return;
      }

      // Redireciona para o Mercado Pago
      window.location.href = data.url;
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={buttonClass}
      >
        {buttonLabel}
      </button>
    );
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className={buttonClass}>
        {buttonLabel}
      </button>

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => !loading && setIsOpen(false)}
      >
        <div
          className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white">Plano {planLabel}</h3>
            <button
              onClick={() => !loading && setIsOpen(false)}
              className="text-slate-500 hover:text-slate-300"
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-slate-400">Plano {planLabel}</span>
                <span className="text-white font-medium">{monthlyPrice}/mês</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-white font-semibold">
                  {addBump ? "Total" : "Cobrança"}
                </span>
                <span className="text-emerald-400 font-semibold">
                  {addBump
                    ? `R$ ${(parseFloat(totalPrice.replace("R$ ", "").replace(",", ".")) + 67).toFixed(2).replace(".", ",")}`
                    : totalPrice}
                </span>
              </div>
              {addBump && (
                <p className="text-xs text-slate-500 mt-2">
                  Assinatura {totalPrice} + Pacote Arquitetura da Liberdade R$ 67,00 (cobrança única)
                </p>
              )}
            </div>

            {showBump && (
              <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-3 transition-colors hover:bg-amber-500/[0.06]">
                <input
                  type="checkbox"
                  checked={addBump}
                  onChange={(e) => setAddBump(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-amber-500"
                  disabled={loading}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Gift className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-sm font-medium text-white">Adicionar Pacote Arquitetura da Liberdade</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">eBook + Workbook + Planilha de Cenários</p>
                  <p className="text-xs text-amber-400 font-semibold mt-1">+ R$ 67,00 (cobrança única)</p>
                </div>
              </label>
            )}

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Seu e-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="seu@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm rounded-full transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                "Ir para o pagamento"
              )}
            </button>

            <p className="text-[10px] text-center text-slate-500">
              Você será redirecionado para o Mercado Pago para completar o pagamento
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
