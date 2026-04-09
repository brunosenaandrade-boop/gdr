"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-white mb-2">Algo deu errado</h2>
          <p className="text-sm text-slate-400 mb-6">Ocorreu um erro inesperado.</p>
          <button onClick={reset} className="rounded-full bg-emerald-500 px-4 py-2 text-sm text-black hover:bg-emerald-400">
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
