import type { Metadata } from "next";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-black">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center px-4">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600">
              <Shield className="h-3.5 w-3.5 text-black fill-black" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">Guarda Dinheiro</span>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Política de Privacidade</h1>
        <p className="text-sm text-slate-500 mb-12">Última atualização: 08 de abril de 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-slate-400">
          <section>
            <h2 className="text-lg font-medium text-white mb-3">1. Introdução</h2>
            <p>
              O Guarda Dinheiro (&quot;nós&quot;, &quot;nosso&quot; ou &quot;Plataforma&quot;) está comprometido com a proteção da privacidade
              dos seus usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos
              suas informações pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">2. Dados que coletamos</h2>
            <p className="mb-3">Coletamos os seguintes dados pessoais:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><span className="text-slate-300">Dados de cadastro:</span> nome completo, e-mail, CPF ou CNPJ, telefone, razão social (para PJ).</li>
              <li><span className="text-slate-300">Dados financeiros:</span> lançamentos de receitas e despesas, categorias, valores, datas de vencimento e pagamento.</li>
              <li><span className="text-slate-300">Dados de comunicação:</span> mensagens de texto e áudio enviadas via WhatsApp para registro de lançamentos.</li>
              <li><span className="text-slate-300">Dados técnicos:</span> endereço IP, tipo de navegador, sistema operacional e dados de uso da plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">3. Como usamos seus dados</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Fornecer e manter os serviços de controle financeiro.</li>
              <li>Processar lançamentos financeiros enviados via painel web ou WhatsApp.</li>
              <li>Transcrever áudios e interpretar mensagens de texto para registro automático de lançamentos.</li>
              <li>Categorizar automaticamente lançamentos com auxílio de inteligência artificial.</li>
              <li>Gerar relatórios, gráficos e análises financeiras personalizadas.</li>
              <li>Enviar confirmações e notificações sobre lançamentos via WhatsApp.</li>
              <li>Melhorar a qualidade e segurança da plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">4. Compartilhamento de dados</h2>
            <p className="mb-3">Seus dados podem ser compartilhados com:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><span className="text-slate-300">Provedores de infraestrutura:</span> serviços de hospedagem e banco de dados para operação da plataforma.</li>
              <li><span className="text-slate-300">Provedores de IA:</span> serviços de inteligência artificial para transcrição de áudio e interpretação de lançamentos. Os dados são processados de forma anônima e não são retidos por esses provedores.</li>
              <li><span className="text-slate-300">Serviços de mensageria:</span> API oficial do WhatsApp para envio e recebimento de mensagens.</li>
            </ul>
            <p className="mt-3">Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">5. Segurança dos dados</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
              criptografia em trânsito (TLS/HTTPS), isolamento de dados por conta (cada usuário só acessa seus próprios dados),
              autenticação segura com senha criptografada e monitoramento contínuo de acessos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">6. Retenção de dados</h2>
            <p>
              Seus dados são mantidos enquanto sua conta estiver ativa. Ao solicitar a exclusão da conta,
              todos os seus dados pessoais e financeiros serão removidos permanentemente em até 30 dias,
              exceto quando a retenção for exigida por obrigação legal.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">7. Seus direitos (LGPD)</h2>
            <p className="mb-3">Conforme a LGPD, você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Confirmar a existência de tratamento dos seus dados.</li>
              <li>Acessar seus dados pessoais.</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</li>
              <li>Solicitar a portabilidade dos dados.</li>
              <li>Revogar o consentimento a qualquer momento.</li>
              <li>Solicitar a exclusão dos dados pessoais tratados com base no consentimento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">8. Contato</h2>
            <p>
              Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade,
              entre em contato pelo e-mail: <span className="text-emerald-400">contato@guardadinheiro.com.br</span>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-4xl px-4 flex items-center justify-between">
          <p className="text-[10px] text-slate-600">&copy; 2026 Guarda Dinheiro. Todos os direitos reservados.</p>
          <Link href="/termos" className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">Termos de Uso</Link>
        </div>
      </footer>
    </div>
  );
}
