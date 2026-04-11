import { NextRequest, NextResponse } from "next/server";

/**
 * Verifica o header `Authorization: Bearer <CRON_SECRET>` que a Vercel
 * Cron envia automaticamente. Retorna uma NextResponse 401/500 em caso
 * de falha, ou null em caso de sucesso.
 */
export function verifyCronAuth(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET não configurado" },
      { status: 500 },
    );
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
