import { z } from "zod";

// ===== Auth =====
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string().min(6, "Minimo 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

// ===== Onboarding =====
export const onboardingPFSchema = z.object({
  type: z.literal("pf"),
  name: z.string().min(3, "Minimo 3 caracteres"),
  document: z.string().min(14, "CPF inválido"), // com mascara
  phone: z.string().optional(),
});

export const onboardingPJSchema = z.object({
  type: z.literal("pj"),
  name: z.string().min(3, "Minimo 3 caracteres"),
  document: z.string().min(18, "CNPJ inválido"), // com mascara
  trade_name: z.string().min(3, "Minimo 3 caracteres"),
  phone: z.string().optional(),
});

export const onboardingSchema = z.discriminatedUnion("type", [
  onboardingPFSchema,
  onboardingPJSchema,
]);

// ===== Transaction =====
export const transactionSchema = z.object({
  type: z.enum(["receita", "despesa"]),
  description: z.string().min(1, "Descrição obrigatória"),
  amount: z.number().positive("Valor deve ser positivo"),
  category_id: z.string().uuid().nullable(),
  due_date: z.string().nullable(),
  paid_date: z.string().nullable(),
  status: z.enum(["pendente", "pago", "atrasado", "cancelado"]),
  notes: z.string().nullable(),
});

// ===== Category =====
export const categorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  type: z.enum(["receita", "despesa"]),
  icon: z.string().nullable(),
  color: z.string().nullable(),
});

// ===== WhatsApp =====
export const whatsappLinkSchema = z.object({
  phone_number: z.string().min(10, "Número inválido"),
});

export const whatsappVerifySchema = z.object({
  code: z.string().length(6, "Codigo deve ter 6 digitos"),
});

// ===== AI Parse (resposta da OpenAI) =====
export const aiParsedTransactionSchema = z.object({
  type: z.enum(["receita", "despesa"]),
  description: z.string(),
  amount: z.number().positive(),
  category_suggestion: z.string(),
  counterparty: z.string().nullable().optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  due_date: z.string().nullable().optional(),
  is_recurring: z.boolean().optional(),
  day_of_month: z.number().int().min(1).max(31).optional(),
});

// ===== Tenant =====
export const tenantUpdateSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(200),
  document: z.string().min(11, "Documento inválido").max(20),
  trade_name: z.string().max(200).nullable(),
  phone: z.string().max(20).nullable(),
});

// ===== Type exports =====
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type WhatsAppLinkInput = z.infer<typeof whatsappLinkSchema>;
export type WhatsAppVerifyInput = z.infer<typeof whatsappVerifySchema>;
