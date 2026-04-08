import { describe, it, expect } from "vitest";
import {
  isValidCPF,
  isValidCNPJ,
  maskCPF,
  maskCNPJ,
  maskPhone,
  formatCurrency,
  formatDate,
} from "./utils";

// ===== CPF =====
describe("isValidCPF", () => {
  it("aceita CPFs validos", () => {
    expect(isValidCPF("52998224725")).toBe(true);
    expect(isValidCPF("11144477735")).toBe(true);
    expect(isValidCPF("00000000191")).toBe(true); // CPF valido raro
  });

  it("rejeita CPFs com todos digitos iguais", () => {
    expect(isValidCPF("11111111111")).toBe(false);
    expect(isValidCPF("00000000000")).toBe(false);
    expect(isValidCPF("99999999999")).toBe(false);
  });

  it("rejeita CPFs com tamanho errado", () => {
    expect(isValidCPF("123")).toBe(false);
    expect(isValidCPF("")).toBe(false);
    expect(isValidCPF("123456789012")).toBe(false);
  });

  it("rejeita CPFs com digito verificador errado", () => {
    expect(isValidCPF("52998224726")).toBe(false); // ultimo digito errado
    expect(isValidCPF("52998224715")).toBe(false); // penultimo errado
  });

  it("aceita CPF com mascara (apos limpar)", () => {
    const cpf = "529.982.247-25".replace(/\D/g, "");
    expect(isValidCPF(cpf)).toBe(true);
  });
});

// ===== CNPJ =====
describe("isValidCNPJ", () => {
  it("aceita CNPJs validos", () => {
    expect(isValidCNPJ("11222333000181")).toBe(true);
    expect(isValidCNPJ("11444777000161")).toBe(true);
  });

  it("rejeita CNPJs com todos digitos iguais", () => {
    expect(isValidCNPJ("11111111111111")).toBe(false);
    expect(isValidCNPJ("00000000000000")).toBe(false);
  });

  it("rejeita CNPJs com tamanho errado", () => {
    expect(isValidCNPJ("123")).toBe(false);
    expect(isValidCNPJ("")).toBe(false);
    expect(isValidCNPJ("123456789012345")).toBe(false);
  });

  it("rejeita CNPJs com digito verificador errado", () => {
    expect(isValidCNPJ("11222333000182")).toBe(false);
  });
});

// ===== Mascaras =====
describe("maskCPF", () => {
  it("aplica mascara corretamente", () => {
    expect(maskCPF("52998224725")).toBe("529.982.247-25");
    expect(maskCPF("529")).toBe("529");
    expect(maskCPF("5299822")).toBe("529.982.2");
  });

  it("limita a 11 digitos", () => {
    expect(maskCPF("529982247251234")).toBe("529.982.247-25");
  });

  it("remove caracteres nao numericos", () => {
    expect(maskCPF("abc529def982ghi")).toBe("529.982");
  });
});

describe("maskCNPJ", () => {
  it("aplica mascara corretamente", () => {
    expect(maskCNPJ("11222333000181")).toBe("11.222.333/0001-81");
  });

  it("limita a 14 digitos", () => {
    expect(maskCNPJ("112223330001819999")).toBe("11.222.333/0001-81");
  });
});

describe("maskPhone", () => {
  it("aplica mascara corretamente", () => {
    expect(maskPhone("11999999999")).toBe("(11) 99999-9999");
    expect(maskPhone("1199")).toBe("(11) 99");
  });

  it("limita a 11 digitos", () => {
    expect(maskPhone("119999999991234")).toBe("(11) 99999-9999");
  });
});

// ===== Formatacao =====
describe("formatCurrency", () => {
  it("formata centavos para BRL", () => {
    expect(formatCurrency(15000)).toBe("R$\u00a0150,00");
    expect(formatCurrency(100)).toBe("R$\u00a01,00");
    expect(formatCurrency(0)).toBe("R$\u00a00,00");
    expect(formatCurrency(999999)).toBe("R$\u00a09.999,99");
  });

  it("formata valores negativos", () => {
    expect(formatCurrency(-5000)).toContain("50,00");
  });
});

describe("formatDate", () => {
  it("formata ISO para dd/mm/aaaa", () => {
    const result = formatDate("2026-04-08T10:00:00Z");
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
