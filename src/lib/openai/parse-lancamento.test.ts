import { describe, it, expect } from "vitest";
import { polishDescription } from "./parse-lancamento";

describe("polishDescription", () => {
  const fixedDate = new Date("2026-04-11T12:00:00Z");

  describe("descrições já boas (não genéricas)", () => {
    it("mantém descrições específicas com mais de 2 palavras", () => {
      expect(polishDescription("Conta de luz", null, "despesa", fixedDate)).toBe("Conta de luz");
      expect(polishDescription("Salário da empresa", null, "receita", fixedDate)).toBe("Salário da empresa");
      expect(polishDescription("Jantar no restaurante", null, "despesa", fixedDate)).toBe("Jantar no restaurante");
    });

    it("capitaliza a primeira letra", () => {
      expect(polishDescription("conta de internet", null, "despesa", fixedDate)).toBe("Conta de internet");
    });
  });

  describe("descrições genéricas com counterparty", () => {
    it("enriquece receita com 'de'", () => {
      expect(polishDescription("Recebimento", "João Silva", "receita", fixedDate)).toBe("Recebimento de João Silva");
    });

    it("enriquece despesa com 'para'", () => {
      expect(polishDescription("Pagamento", "Netflix", "despesa", fixedDate)).toBe("Pagamento para Netflix");
    });

    it("funciona com descrição em lowercase", () => {
      expect(polishDescription("pagamento", "Maria", "despesa", fixedDate)).toBe("Pagamento para Maria");
    });
  });

  describe("descrições genéricas sem counterparty", () => {
    it("adiciona data no formato DD/MM", () => {
      expect(polishDescription("Recebimento", null, "receita", fixedDate)).toBe("Recebimento - 11/04");
    });

    it("funciona para despesa", () => {
      expect(polishDescription("Pagamento", null, "despesa", fixedDate)).toBe("Pagamento - 11/04");
    });

    it("capitaliza e adiciona data para compra", () => {
      expect(polishDescription("compra", null, "despesa", fixedDate)).toBe("Compra - 11/04");
    });
  });

  describe("edge cases", () => {
    it("descrição vazia usa default baseado no tipo", () => {
      expect(polishDescription("", null, "receita", fixedDate)).toBe("Recebimento - 11/04");
      expect(polishDescription("", null, "despesa", fixedDate)).toBe("Pagamento - 11/04");
    });

    it("descrição com uma palavra não genérica mantém com data", () => {
      expect(polishDescription("Netflix", null, "despesa", fixedDate)).toBe("Netflix - 11/04");
    });

    it("counterparty vazio é tratado como null", () => {
      expect(polishDescription("Recebimento", "", "receita", fixedDate)).toBe("Recebimento - 11/04");
      expect(polishDescription("Recebimento", "   ", "receita", fixedDate)).toBe("Recebimento - 11/04");
    });
  });
});
