"use client";

import { useState, createContext, useContext, useCallback, useEffect } from "react";
import { Gift, Loader2, Mail, X, CreditCard, Zap, Shield, MessageSquare } from "lucide-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PlanSelection = {
  plan: "mensal" | "anual";
  planLabel: string;
  monthlyPrice: string;
  totalPrice: string;
} | null;

type SubscribeCtx = {
  selected: PlanSelection;
  open: (p: NonNullable<PlanSelection>) => void;
  close: () => void;
};

const SubscribeContext = createContext<SubscribeCtx | null>(null);

export function SubscribeProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<PlanSelection>(null);

  const open = useCallback((p: NonNullable<PlanSelection>) => setSelected(p), []);
  const close = useCallback(() => setSelected(null), []);

  return (
    <SubscribeContext.Provider value={{ selected, open, close }}>
      {children}
      {selected && <SubscribeModal selection={selected} onClose={close} />}
    </SubscribeContext.Provider>
  );
}

function useSubscribe() {
  const ctx = useContext(SubscribeContext);
  if (!ctx) throw new Error("useSubscribe must be inside SubscribeProvider");
  return ctx;
}

interface SubscribeFormProps {
  plan: "mensal" | "anual";
  planLabel: string;
  monthlyPrice: string;
  totalPrice: string;
  buttonClass: string;
  buttonLabel: string;
}

export function SubscribeForm(props: SubscribeFormProps) {
  const { open } = useSubscribe();
  const { buttonClass, buttonLabel, ...selection } = props;

  return (
    <button
      onClick={() => open(selection)}
      className={buttonClass}
    >
      {buttonLabel}
    </button>
  );
}

function PaymentBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-300">
      {children}
    </span>
  );
}

function SubscribeModal({
  selection,
  onClose,
}: {
  selection: NonNullable<PlanSelection>;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [addBump, setAddBump] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"recurring" | "one-time">("recurring");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isAnual = selection.plan === "anual";
  const totalNumeric = parseFloat(selection.totalPrice.replace("R$ ", "").replace(".", "").replace(",", "."));
  const totalWithBump = totalNumeric + 67;
  const finalTotal = addBump
    ? `R$ ${totalWithBump.toFixed(2).replace(".", ",")}`
    : selection.totalPrice;

  function validateEmail() {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("");
      return;
    }
    setEmailError(EMAIL_REGEX.test(trimmed) ? "" : "E-mail inválido");
  }

  // Fecha modal ao pressionar Escape
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    document.addEventListener("keydown", handleKeydown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = "";
    };
  }, [loading, onClose]);

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setEmail(next);
    setError("");
    const trimmed = next.trim();
    if (!trimmed) {
      setEmailError("");
      return;
    }
    setEmailError(EMAIL_REGEX.test(trimmed) ? "" : "E-mail inválido");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError("E-mail inválido");
      return;
    }

    setLoading(true);
    setError("");

    // Mensal sempre usa PreApproval (recurring). Anual pode escolher.
    const useOneTime = isAnual && paymentMethod === "one-time";
    const endpoint = useOneTime
      ? "/api/subscriptions/checkout-pro"
      : "/api/subscriptions/preapproval";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selection.plan,
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

      window.location.href = data.url;
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscribe-modal-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => !loading && onClose()}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 id="subscribe-modal-title" className="text-lg font-semibold text-white">Plano {selection.planLabel}</h3>
          <button
            onClick={() => !loading && onClose()}
            className="text-slate-500 hover:text-slate-300"
            disabled={loading}
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isAnual && (
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Como você quer pagar?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("recurring")}
                  disabled={loading}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    paymentMethod === "recurring"
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">Assinatura</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Cartão cobrado automaticamente a cada 12 meses
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("one-time")}
                  disabled={loading}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    paymentMethod === "one-time"
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">Pagamento único</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    PIX ou até 12x no cartão. Sem renovação automática
                  </p>
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-white">Total</span>
              <span className="text-lg font-bold text-emerald-400">{finalTotal}</span>
            </div>
            {isAnual && !addBump && (
              <p className="text-[11px] text-slate-500 mt-1">
                Equivalente a {selection.monthlyPrice}/mês
              </p>
            )}
            {addBump && (
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                Plano {selection.planLabel}: {selection.totalPrice}
                <br />
                Pacote Arquitetura da Liberdade: R$ 67,00 (cobrança única)
              </p>
            )}
          </div>

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

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block" htmlFor="subscribe-email">
              Seu e-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                id="subscribe-email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={validateEmail}
                placeholder="seu@email.com"
                className={`w-full bg-white/5 border rounded-lg pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:ring-1 ${
                  emailError
                    ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                    : "border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                }`}
                required
                disabled={loading}
                autoComplete="email"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "subscribe-email-error" : undefined}
              />
            </div>
            {emailError && (
              <p id="subscribe-email-error" className="text-xs text-red-400 mt-1">
                {emailError}
              </p>
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email.trim() || !!emailError}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-black font-bold text-sm rounded-full transition-colors flex items-center justify-center gap-2"
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

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-300/80">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Após pagar, seu acesso libera no WhatsApp em instantes</span>
          </div>

          <div className="pt-1 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>
                Pagamento seguro pelo <span className="font-semibold text-white">Mercado Pago</span>
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <PaymentBadge>PIX</PaymentBadge>
              <PaymentBadge>Visa</PaymentBadge>
              <PaymentBadge>Mastercard</PaymentBadge>
              <PaymentBadge>Elo</PaymentBadge>
              <PaymentBadge>Amex</PaymentBadge>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
