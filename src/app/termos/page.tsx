import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export default function TermosPage() {
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
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Termos de Uso</h1>
        <p className="text-sm text-slate-500 mb-12">Última atualização: 08 de abril de 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-slate-400">
          <section>
            <h2 className="text-lg font-medium text-white mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao criar uma conta e utilizar o Guarda Dinheiro (&quot;Plataforma&quot;), você concorda com estes Termos de Uso.
              Se não concordar com qualquer parte destes termos, não utilize a Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">2. Descrição do Serviço</h2>
            <p>
              O Guarda Dinheiro é uma plataforma de controle financeiro pessoal e empresarial que permite:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 mt-3">
              <li>Registrar receitas e despesas via painel web ou WhatsApp.</li>
              <li>Categorizar lançamentos automaticamente com auxílio de inteligência artificial.</li>
              <li>Transcrever áudios enviados via WhatsApp para registro de lançamentos.</li>
              <li>Visualizar relatórios, gráficos de fluxo de caixa e análises por categoria.</li>
              <li>Gerenciar contas a pagar e a receber com controle de vencimentos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">3. Cadastro e Conta</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Você deve fornecer informações verdadeiras, completas e atualizadas no cadastro.</li>
              <li>Cada conta é pessoal e intransferível. Você é responsável por manter sua senha segura.</li>
              <li>A Plataforma suporta contas de Pessoa Física (CPF) e Pessoa Jurídica (CNPJ).</li>
              <li>Você é responsável por todas as atividades realizadas com sua conta.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">4. Uso Aceitável</h2>
            <p className="mb-3">Ao utilizar a Plataforma, você concorda em não:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Utilizar o serviço para fins ilegais ou não autorizados.</li>
              <li>Tentar acessar dados de outros usuários.</li>
              <li>Enviar conteúdo malicioso, abusivo ou spam via WhatsApp.</li>
              <li>Realizar engenharia reversa ou tentar comprometer a segurança da Plataforma.</li>
              <li>Utilizar bots ou scripts automatizados para acessar a Plataforma sem autorização.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">5. Integração com WhatsApp</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>A integração com WhatsApp utiliza a API oficial da Meta (WhatsApp Business API).</li>
              <li>Ao vincular seu número, você autoriza o envio e recebimento de mensagens para fins de registro de lançamentos financeiros.</li>
              <li>Mensagens de texto e áudio enviadas são processadas para identificar tipo, valor, descrição e categoria do lançamento.</li>
              <li>Nenhum lançamento é registrado sem sua confirmação explícita no chat.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">6. Inteligência Artificial</h2>
            <p>
              A Plataforma utiliza inteligência artificial para transcrever áudios e interpretar mensagens financeiras.
              Embora busquemos alta precisão, o sistema pode cometer erros de interpretação. Por isso, todo lançamento
              via WhatsApp requer confirmação do usuário antes de ser registrado. A responsabilidade final pela
              verificação dos dados é do usuário.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">7. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo da Plataforma (design, código, marca, textos) é de propriedade do Guarda Dinheiro
              e está protegido por leis de propriedade intelectual. Você não pode copiar, modificar, distribuir
              ou reproduzir qualquer parte da Plataforma sem autorização prévia.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">8. Limitação de Responsabilidade</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>A Plataforma é fornecida &quot;como está&quot;, sem garantias de qualquer tipo.</li>
              <li>Não nos responsabilizamos por decisões financeiras tomadas com base nos dados da Plataforma.</li>
              <li>Não garantimos disponibilidade ininterrupta do serviço.</li>
              <li>Não nos responsabilizamos por perdas decorrentes de uso indevido da conta ou vazamento de senha por parte do usuário.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">9. Cancelamento e Exclusão</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Você pode cancelar sua conta a qualquer momento nas configurações.</li>
              <li>Ao cancelar, todos os seus dados serão excluídos permanentemente em até 30 dias.</li>
              <li>Reservamo-nos o direito de suspender ou encerrar contas que violem estes Termos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">10. Alterações nos Termos</h2>
            <p>
              Podemos atualizar estes Termos periodicamente. Notificaremos sobre alterações relevantes
              por e-mail ou aviso na Plataforma. O uso continuado após alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">11. Foro e Legislação Aplicável</h2>
            <p>
              Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da comarca do
              domicílio do usuário para dirimir quaisquer controvérsias, conforme o Código de Defesa do Consumidor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">12. Contato</h2>
            <p>
              Para dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail:{" "}
              <span className="text-emerald-400">contato@guardadinheiro.com.br</span>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-4xl px-4 flex items-center justify-between">
          <p className="text-[10px] text-slate-600">&copy; 2026 Guarda Dinheiro. Todos os direitos reservados.</p>
          <Link href="/privacidade" className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">Política de Privacidade</Link>
        </div>
      </footer>
    </div>
  );
}
