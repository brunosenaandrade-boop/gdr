import { ComoFuncionaClient } from "./client";

export const metadata = {
  title: "Como Funciona",
  description: "Aprenda a usar o Guarda Dinheiro, seu assistente financeiro pessoal via WhatsApp.",
  alternates: { canonical: "/como-funciona" },
  openGraph: {
    title: "Como Funciona | Guarda Dinheiro",
    description:
      "Tutorial em 9 passos: áudio no WhatsApp, IA organiza, painel web completo.",
    url: "/como-funciona",
    type: "website" as const,
    locale: "pt_BR",
  },
};

export default function ComoFuncionaPage() {
  return <ComoFuncionaClient />;
}
