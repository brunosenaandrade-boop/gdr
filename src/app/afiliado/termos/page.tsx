"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptAffiliateTerms } from "@/lib/affiliates/affiliate-actions";

export default function AffiliateTermsPage() {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleAccept() {
    setLoading(true);
    setError("");
    const result = await acceptAffiliateTerms();
    if (!result.ok) {
      setError(result.error ?? "Erro ao aceitar termos.");
      setLoading(false);
      return;
    }
    router.push("/afiliado");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] mx-auto mb-4">
            <Shield className="h-7 w-7 text-black" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Termos de Adesão ao Programa de Afiliados</h1>
          <p className="text-sm text-slate-400 mt-2">Leia com atenção antes de continuar</p>
        </div>

        {/* Terms content */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8 max-h-[60vh] overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed">
          <div className="flex items-center gap-2 text-emerald-400 mb-4">
            <FileText className="h-5 w-5" />
            <span className="text-xs uppercase tracking-wider font-medium">Guarda Dinheiro — Programa de Afiliados</span>
          </div>

          <section>
            <h2 className="text-white font-semibold mb-2">1. Natureza da Relação</h2>
            <p>
              O presente termo estabelece uma relação de <strong className="text-white">prestação de serviços autônoma</strong> entre
              o Afiliado e o Guarda Dinheiro. <strong className="text-white">Não há vínculo empregatício</strong>, societário ou de
              qualquer outra natureza trabalhista entre as partes. O Afiliado atua como promotor independente, sem subordinação,
              habitualidade obrigatória ou exclusividade.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">2. Atividade do Afiliado</h2>
            <p>
              O Afiliado promove os produtos e serviços do Guarda Dinheiro utilizando seu código ou cupom exclusivo.
              A divulgação deve ser feita de forma ética, sem práticas enganosas, spam, ou qualquer conduta que possa
              prejudicar a imagem do Guarda Dinheiro ou violar a legislação vigente.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">3. Comissão</h2>
            <p>
              O Afiliado receberá comissão sobre vendas efetivamente realizadas e confirmadas por meio de seu cupom ou link.
              A taxa de comissão padrão é de <strong className="text-white">40% (quarenta por cento)</strong> sobre o valor da venda,
              podendo ser alterada pelo Guarda Dinheiro mediante aviso prévio. O pagamento é <strong className="text-white">condicionado
              à efetivação da venda</strong> — não há garantia de rendimento mínimo.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">4. Pagamento</h2>
            <p>
              As comissões pendentes serão consolidadas até o dia 5 de cada mês e pagas via PIX ou transferência bancária,
              conforme dados cadastrados pelo Afiliado. O Guarda Dinheiro reserva-se o direito de reter pagamentos em caso
              de suspeita de fraude, chargebacks ou violação destes termos.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">5. Ausência de Garantias</h2>
            <p>
              O Guarda Dinheiro <strong className="text-white">não garante</strong> volume de vendas, rendimento mínimo, ou qualquer
              resultado financeiro ao Afiliado. Os resultados dependem exclusivamente do esforço e estratégia do próprio Afiliado.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">6. Obrigações Fiscais e Tributárias</h2>
            <p>
              O Afiliado é integralmente responsável por suas obrigações fiscais, tributárias e previdenciárias (INSS, ISS, IR, etc.),
              devendo estar regularizado como MEI, autônomo ou pessoa jurídica conforme a legislação brasileira. O Guarda Dinheiro
              não realiza retenções na fonte nem assume responsabilidade por tributos do Afiliado.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">7. Exclusividade</h2>
            <p>
              <strong className="text-white">Não há exclusividade.</strong> O Afiliado pode promover produtos e serviços de terceiros,
              desde que não sejam concorrentes diretos do Guarda Dinheiro durante a vigência deste termo.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">8. Obrigações Trabalhistas</h2>
            <p>
              Por se tratar de relação autônoma, o Afiliado <strong className="text-white">não tem direito</strong> a férias,
              13º salário, FGTS, aviso prévio, seguro-desemprego, vale-transporte, vale-alimentação ou qualquer outro
              benefício de natureza trabalhista. Todas as contribuições previdenciárias são de responsabilidade exclusiva do Afiliado.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">9. Rescisão</h2>
            <p>
              Qualquer uma das partes pode encerrar esta relação a qualquer momento, sem multa ou penalidade, mediante
              comunicação por escrito (email). As comissões sobre vendas já realizadas e confirmadas antes da rescisão
              serão pagas normalmente.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">10. Conduta Proibida</h2>
            <p>
              É vedado ao Afiliado: (a) fazer promessas falsas sobre o produto; (b) utilizar spam ou mensagens não solicitadas;
              (c) criar anúncios que induzam ao erro; (d) se apresentar como funcionário ou representante oficial do Guarda Dinheiro;
              (e) violar a LGPD ou qualquer legislação de proteção de dados. A violação de qualquer item resulta em suspensão
              imediata e perda de comissões pendentes.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">11. Propriedade Intelectual</h2>
            <p>
              O uso da marca, logotipos e materiais do Guarda Dinheiro é autorizado exclusivamente para fins de divulgação
              como afiliado, conforme materiais disponibilizados no painel. Qualquer uso indevido está sujeito às medidas
              legais cabíveis.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">12. Validade Jurídica</h2>
            <p>
              O aceite digital destes termos tem plena validade jurídica conforme o artigo 107 do Código Civil Brasileiro
              e o Marco Civil da Internet (Lei 12.965/2014). O aceite é registrado com data, hora e identificação do Afiliado.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">13. Foro</h2>
            <p>
              Fica eleito o foro da comarca de domicílio do Guarda Dinheiro para dirimir quaisquer controvérsias
              decorrentes destes termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>
        </div>

        {/* Accept section */}
        <div className="mt-6 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/30"
            />
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
              Li e compreendi integralmente os Termos de Adesão ao Programa de Afiliados do Guarda Dinheiro e
              <strong className="text-white"> aceito todas as condições</strong> aqui estabelecidas.
            </span>
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            onClick={handleAccept}
            disabled={!accepted || loading}
            loading={loading}
            className="w-full"
          >
            Aceitar e Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
