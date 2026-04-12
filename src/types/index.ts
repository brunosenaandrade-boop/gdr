import type { Database } from "./supabase";

type Tables = Database["public"]["Tables"];

// ===== Tenant =====
export type TenantType = "pf" | "pj";

export type Tenant = Omit<Tables["tenants"]["Row"], "type"> & {
  type: TenantType;
};

// ===== Category =====
export type CategoryType = "receita" | "despesa";

export type Category = Omit<Tables["categories"]["Row"], "type"> & {
  type: CategoryType;
};

// ===== Transaction =====
export type TransactionType = "receita" | "despesa";
export type TransactionStatus = "pendente" | "pago" | "atrasado" | "cancelado";
export type TransactionSource = "web" | "whatsapp";

export type Transaction = Omit<
  Tables["transactions"]["Row"],
  "type" | "status" | "source"
> & {
  type: TransactionType;
  status: TransactionStatus;
  source: TransactionSource;
  category?: Category;
};

// ===== WhatsApp =====
export type WhatsAppLink = Tables["whatsapp_links"]["Row"];

export type WhatsAppPending = Omit<
  Tables["whatsapp_pending"]["Row"],
  "parsed_type"
> & {
  parsed_type: TransactionType | null;
};

// ===== AI Parse Result =====
export type AIConfidence = "high" | "medium" | "low";

export type AIParsedTransaction = {
  type: TransactionType;
  description: string;
  amount: number; // centavos
  category_suggestion: string;
  counterparty?: string | null;
  confidence?: AIConfidence;
  is_recurring?: boolean;
  day_of_month?: number;
};

// ===== Dashboard =====
export type DashboardStats = {
  total_receitas: number;
  total_despesas: number;
  saldo: number;
  contas_vencidas: number;
  contas_a_vencer: number;
};

export type CashFlowEntry = {
  date: string;
  receitas: number;
  despesas: number;
  saldo: number;
};
