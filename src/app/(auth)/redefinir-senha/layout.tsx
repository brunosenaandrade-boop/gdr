import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nova Senha" };

export default function RedefinirSenhaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
