// ===== Tenant =====
export type TenantType = "pf" | "pj";

export type Tenant = {
  id: string;
  user_id: string;
  type: TenantType;
  name: string;
  document: string;
  trade_name: string | null;
  phone: string | null;
  created_at: string;
};

// ===== Category =====
export type CategoryType = "receita" | "despesa";

export type Category = {
  id: string;
  tenant_id: string;
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
  is_default: boolean;
  created_at: string;
};

// ===== Transaction =====
export type TransactionType = "receita" | "despesa";
export type TransactionStatus = "pendente" | "pago" | "atrasado" | "cancelado";
export type TransactionSource = "web" | "whatsapp";

export type Transaction = {
  id: string;
  tenant_id: string;
  category_id: string | null;
  type: TransactionType;
  description: string;
  amount: number; // centavos
  due_date: string | null;
  paid_date: string | null;
  status: TransactionStatus;
  source: TransactionSource;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
};

// ===== WhatsApp =====
export type WhatsAppLink = {
  id: string;
  tenant_id: string;
  phone_number: string;
  verified: boolean;
  verification_code: string | null;
  created_at: string;
};

export type WhatsAppPending = {
  id: string;
  tenant_id: string;
  raw_message: string;
  parsed_type: TransactionType | null;
  parsed_description: string | null;
  parsed_amount: number | null;
  parsed_category_id: string | null;
  confirmed: boolean;
  expires_at: string;
  created_at: string;
};

// ===== AI Parse Result =====
export type AIParsedTransaction = {
  type: TransactionType;
  description: string;
  amount: number; // centavos
  category_suggestion: string;
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
