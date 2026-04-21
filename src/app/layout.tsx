import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PostHogProvider } from "@/lib/posthog/provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.guardadinheiro.com.br"),
  title: {
    default: "Guarda Dinheiro - Controle Financeiro Inteligente",
    template: "%s | Guarda Dinheiro",
  },
  description:
    "Controle financeiro no WhatsApp com IA. Registre gastos por áudio, receba lembretes e veja tudo no painel. Plano mensal R$ 79,90 ou anual 12x R$ 29,90.",
  keywords: [
    "controle financeiro",
    "finanças pessoais",
    "whatsapp financeiro",
    "organização financeira",
    "gastos pessoais",
    "planejamento financeiro",
  ],
  authors: [{ name: "Guarda Dinheiro" }],
  alternates: { canonical: "/" },
  openGraph: {
    siteName: "Guarda Dinheiro",
    title: "Guarda Dinheiro - Controle Financeiro pelo WhatsApp",
    description:
      "Registre gastos por áudio, receba lembretes e veja tudo no painel. Garantia de 7 dias.",
    url: "/",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guarda Dinheiro - Controle Financeiro pelo WhatsApp",
    description:
      "Registre gastos por áudio, receba lembretes e veja tudo no painel. Garantia de 7 dias.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-slate-100">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
