"use client";

import { useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ContasReceberError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[contas-receber/error.tsx]", error);
  }, [error]);

  return (
    <>
      <AppHeader title="Contas a Receber" description="Receitas pendentes e vencidas" />
      <div className="p-6">
        <Card className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-white">Não foi possível carregar suas contas a receber</h2>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            Houve um problema ao buscar seus dados. Tente novamente em alguns segundos.
          </p>
          {error.digest && (
            <p className="mt-3 text-xs text-slate-600 font-mono">Ref: {error.digest}</p>
          )}
          <div className="mt-6">
            <Button onClick={reset} size="sm">
              <RotateCcw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
