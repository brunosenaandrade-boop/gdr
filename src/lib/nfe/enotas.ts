/**
 * Integração com eNotas — emissão automática de NFS-e após pagamento Hotmart.
 *
 * Se as env vars ENOTAS_API_KEY e ENOTAS_EMPRESA_ID não estiverem configuradas,
 * as funções retornam `skipped` — útil em dev antes de contratar o eNotas.
 */
import * as Sentry from "@sentry/nextjs";

const ENOTAS_API_BASE = "https://api.enotasgw.com.br/v2";

export type NFeCustomer = {
  name: string;
  email: string;
  document: string;        // CPF ou CNPJ
  phone?: string;
  address?: {
    street?: string;
    number?: string;
    district?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  };
};

export type NFeRequest = {
  /** Valor total em reais (não centavos) */
  amount: number;
  description: string;
  customer: NFeCustomer;
  /** ID externo nosso pra tracking — ex: hotmart transaction ID */
  externalId: string;
};

export type NFeResult =
  | { ok: true; nfeId: string; status: string }
  | { ok: false; error: string; skipped?: boolean };

/**
 * Emite uma NFS-e via eNotas.
 * A emissão é assíncrona: eNotas processa e envia callback via webhook.
 */
export async function emitirNFE(req: NFeRequest): Promise<NFeResult> {
  const apiKey = process.env.ENOTAS_API_KEY;
  const empresaId = process.env.ENOTAS_EMPRESA_ID;

  if (!apiKey || !empresaId) {
    console.warn("[enotas] API não configurada — pulando emissão");
    return { ok: false, error: "eNotas não configurado", skipped: true };
  }

  try {
    const response = await fetch(
      `${ENOTAS_API_BASE}/empresas/${empresaId}/nfes`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "NFS-e",
          idExterno: req.externalId,
          cliente: {
            nome: req.customer.name,
            email: req.customer.email,
            tipoPessoa: req.customer.document.replace(/\D/g, "").length === 14 ? "PJ" : "PF",
            cpfCnpj: req.customer.document.replace(/\D/g, ""),
            telefone: req.customer.phone ?? null,
            endereco: req.customer.address
              ? {
                  logradouro: req.customer.address.street,
                  numero: req.customer.address.number,
                  bairro: req.customer.address.district,
                  cidade: req.customer.address.city,
                  uf: req.customer.address.state,
                  cep: req.customer.address.zipcode?.replace(/\D/g, ""),
                }
              : undefined,
          },
          servico: {
            descricao: req.description,
            valorTotal: req.amount,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "(unreadable)");
      console.error(`[enotas] Erro ${response.status}: ${errorBody}`);
      Sentry.captureMessage(`eNotas error ${response.status}`, {
        level: "error",
        extra: { body: errorBody, externalId: req.externalId },
      });
      return { ok: false, error: `API eNotas retornou ${response.status}` };
    }

    const data = await response.json();
    return {
      ok: true,
      nfeId: data.id ?? "",
      status: data.status ?? "pending",
    };
  } catch (err) {
    Sentry.captureException(err);
    console.error("[enotas] Falha inesperada:", err);
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

/**
 * Consulta status de uma NFS-e pelo ID interno do eNotas.
 */
export async function consultarNFE(
  nfeId: string,
): Promise<{ status: string; pdfUrl?: string; xmlUrl?: string } | null> {
  const apiKey = process.env.ENOTAS_API_KEY;
  const empresaId = process.env.ENOTAS_EMPRESA_ID;
  if (!apiKey || !empresaId) return null;

  try {
    const response = await fetch(
      `${ENOTAS_API_BASE}/empresas/${empresaId}/nfes/${nfeId}`,
      { headers: { Authorization: `Basic ${apiKey}` } },
    );
    if (!response.ok) return null;
    const data = await response.json();
    return {
      status: data.status,
      pdfUrl: data.linkDownloadPDF,
      xmlUrl: data.linkDownloadXML,
    };
  } catch (err) {
    Sentry.captureException(err);
    return null;
  }
}
