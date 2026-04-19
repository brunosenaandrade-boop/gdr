"use client";

import { useState } from "react";
import { Copy, CheckCheck } from "lucide-react";

const CHECKOUT_BASE = "https://www.guardadinheiro.com.br/planos";
const SITE_BASE = "https://www.guardadinheiro.com.br";

type Props = {
  affiliateName: string;
  coupons: Array<{ code: string; discountPct: number }>;
};

export function MateriaisClient({ affiliateName, coupons }: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  // Sugestões de copy pra divulgação
  const messages = (couponCode: string, discountPct: number) => [
    {
      title: "Mensagem direta (WhatsApp / DM)",
      text: `Olha, descobri um app que organiza minha vida financeira pelo WhatsApp. Você manda áudio ou texto e ele anota tudo. Eu uso e recomendo!\n\n${discountPct > 0 ? `Usa o cupom *${couponCode}* pra ganhar ${discountPct}% off.` : `Usa meu link: ${SITE_BASE}/planos`}`,
    },
    {
      title: "Story / Post curto",
      text: `Cansado de planilha? Tem um app que controla seu dinheiro pelo WhatsApp. Cupom: ${couponCode}${discountPct > 0 ? ` (${discountPct}% off)` : ""}. Link: ${SITE_BASE}/planos`,
    },
    {
      title: "Email / Texto longo",
      text: `Você já reparou que ninguém aguenta abrir uma planilha pra anotar gasto?\n\nDescobri o Guarda Dinheiro: você manda mensagem ou áudio no WhatsApp e ele organiza tudo automaticamente. Saldo, contas a pagar, lembretes — tudo via WhatsApp.\n\n${discountPct > 0 ? `Como sou parceiro, tenho cupom: *${couponCode}* (${discountPct}% off no plano anual de R$ 358,80).` : `Link: ${SITE_BASE}/planos`}\n\nGarantia de 7 dias. Se não gostar, devolvem o dinheiro.`,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Materiais de divulgação</h1>
        <p className="text-sm text-gray-500 mt-1">
          Use os textos e links abaixo pra divulgar e converter mais
        </p>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-amber-800">
            Você ainda não tem cupons ativos. Solicite ao administrador para começar a divulgar.
          </p>
        </div>
      ) : (
        coupons.map((coupon) => (
          <div key={coupon.code} className="space-y-4">
            {/* Header do cupom */}
            <div className="bg-gray-900 text-white rounded-2xl p-6 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Cupom</div>
                <div className="text-3xl font-mono font-bold mt-1">{coupon.code}</div>
                <div className="text-xs text-gray-400 mt-2">
                  {coupon.discountPct > 0
                    ? `${coupon.discountPct}% de desconto pro cliente`
                    : "Tracking de venda (sem desconto)"}
                </div>
              </div>
              <button
                onClick={() => copyText(`code-${coupon.code}`, coupon.code)}
                className="px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg flex items-center gap-2"
              >
                {copiedKey === `code-${coupon.code}` ? (
                  <>
                    <CheckCheck className="h-4 w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar
                  </>
                )}
              </button>
            </div>

            {/* Link com cupom */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Link de checkout direto
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono break-all">
                  {`${CHECKOUT_BASE}?off=${coupon.code}`}
                </code>
                <button
                  onClick={() => copyText(`link-${coupon.code}`, `${CHECKOUT_BASE}?off=${coupon.code}`)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  {copiedKey === `link-${coupon.code}` ? (
                    <CheckCheck className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Mensagens prontas */}
            <div className="space-y-3">
              {messages(coupon.code, coupon.discountPct).map((msg, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-sm font-semibold text-gray-900">{msg.title}</div>
                    <button
                      onClick={() => copyText(`msg-${coupon.code}-${i}`, msg.text)}
                      className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"
                    >
                      {copiedKey === `msg-${coupon.code}-${i}` ? (
                        <>
                          <CheckCheck className="h-3 w-3 text-emerald-600" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 p-3 rounded-lg">
                    {msg.text}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Dicas */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Dicas pra converter mais</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Conte sua experiência real usando o produto</li>
          <li>Mostre prints de uso (saldo, lembretes, conversas)</li>
          <li>Reforce a garantia de 7 dias — reduz medo do cliente</li>
          <li>Use seu cupom em todos os posts e stories</li>
          <li>Responda dúvidas rapidamente nos comentários</li>
        </ul>
        <p className="text-xs text-blue-700 mt-3">
          Olá <strong>{affiliateName}</strong>! Qualquer dúvida sobre os materiais, fale com o admin.
        </p>
      </div>
    </div>
  );
}
