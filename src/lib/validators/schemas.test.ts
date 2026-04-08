import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  transactionSchema,
  categorySchema,
  aiParsedTransactionSchema,
  whatsappLinkSchema,
  whatsappVerifySchema,
} from "./schemas";

describe("loginSchema", () => {
  it("aceita email e senha validos", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "123456" }).success).toBe(true);
  });

  it("rejeita email invalido", () => {
    expect(loginSchema.safeParse({ email: "invalid", password: "123456" }).success).toBe(false);
  });

  it("rejeita senha curta", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "12345" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("aceita dados validos", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: "123456", confirmPassword: "123456" }).success).toBe(true);
  });

  it("rejeita senhas que nao conferem", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: "123456", confirmPassword: "654321" }).success).toBe(false);
  });
});

describe("transactionSchema", () => {
  const valid = {
    type: "despesa" as const,
    description: "Conta de luz",
    amount: 15000,
    category_id: null,
    due_date: null,
    paid_date: null,
    status: "pendente" as const,
    notes: null,
  };

  it("aceita dados validos", () => {
    expect(transactionSchema.safeParse(valid).success).toBe(true);
  });

  it("rejeita amount negativo", () => {
    expect(transactionSchema.safeParse({ ...valid, amount: -100 }).success).toBe(false);
  });

  it("rejeita amount zero", () => {
    expect(transactionSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
  });

  it("rejeita tipo invalido", () => {
    expect(transactionSchema.safeParse({ ...valid, type: "outro" }).success).toBe(false);
  });

  it("rejeita status invalido", () => {
    expect(transactionSchema.safeParse({ ...valid, status: "invalido" }).success).toBe(false);
  });

  it("rejeita descricao vazia", () => {
    expect(transactionSchema.safeParse({ ...valid, description: "" }).success).toBe(false);
  });
});

describe("categorySchema", () => {
  it("aceita categoria valida", () => {
    expect(categorySchema.safeParse({ name: "Moradia", type: "despesa", icon: null, color: null }).success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    expect(categorySchema.safeParse({ name: "", type: "despesa", icon: null, color: null }).success).toBe(false);
  });

  it("rejeita tipo invalido", () => {
    expect(categorySchema.safeParse({ name: "X", type: "outro", icon: null, color: null }).success).toBe(false);
  });
});

describe("aiParsedTransactionSchema", () => {
  it("aceita resposta valida da IA", () => {
    const valid = { type: "despesa", description: "Luz", amount: 15000, category_suggestion: "Moradia" };
    expect(aiParsedTransactionSchema.safeParse(valid).success).toBe(true);
  });

  it("rejeita amount zero", () => {
    const invalid = { type: "despesa", description: "Luz", amount: 0, category_suggestion: "Moradia" };
    expect(aiParsedTransactionSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejeita tipo invalido", () => {
    const invalid = { type: "ganho", description: "Luz", amount: 100, category_suggestion: "X" };
    expect(aiParsedTransactionSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("whatsappLinkSchema", () => {
  it("aceita numero valido", () => {
    expect(whatsappLinkSchema.safeParse({ phone_number: "11999999999" }).success).toBe(true);
  });

  it("rejeita numero curto", () => {
    expect(whatsappLinkSchema.safeParse({ phone_number: "123" }).success).toBe(false);
  });
});

describe("whatsappVerifySchema", () => {
  it("aceita codigo de 6 digitos", () => {
    expect(whatsappVerifySchema.safeParse({ code: "123456" }).success).toBe(true);
  });

  it("rejeita codigo com tamanho errado", () => {
    expect(whatsappVerifySchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(whatsappVerifySchema.safeParse({ code: "1234567" }).success).toBe(false);
  });
});
