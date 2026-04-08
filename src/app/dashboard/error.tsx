"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-32 px-6">
      <Card className="max-w-md text-center p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 mx-auto mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Algo deu errado</h2>
        <p className="text-sm text-slate-400 mb-6">
          {error.message || "Ocorreu um erro ao carregar esta pagina. Tente novamente."}
        </p>
        <Button onClick={reset} variant="secondary">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </Card>
    </div>
  );
}
