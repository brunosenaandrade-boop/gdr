import { describe, it, expect } from "vitest";
import { matchCategory } from "./category-match";
import type { Category } from "@/types";

function cat(name: string, type: "receita" | "despesa", id = name): Category {
  return {
    id,
    tenant_id: "t1",
    name,
    type,
    icon: null,
    color: null,
    is_default: false,
    created_at: null,
  };
}

const categorias: Category[] = [
  cat("Moradia", "despesa"),
  cat("Alimentação", "despesa"),
  cat("Transporte", "despesa"),
  cat("Saúde", "despesa"),
  cat("Outros", "despesa", "outros-despesa"),
  cat("Salário", "receita"),
  cat("Vendas", "receita"),
  cat("Outros", "receita", "outros-receita"),
];

describe("matchCategory", () => {
  it("match exato funciona", () => {
    expect(matchCategory("Moradia", "despesa", categorias)?.name).toBe("Moradia");
  });

  it("match exato é case-insensitive", () => {
    expect(matchCategory("MORADIA", "despesa", categorias)?.name).toBe("Moradia");
    expect(matchCategory("moradia", "despesa", categorias)?.name).toBe("Moradia");
  });

  it("match normalizado ignora acentos", () => {
    expect(matchCategory("alimentacao", "despesa", categorias)?.name).toBe("Alimentação");
    expect(matchCategory("SAUDE", "despesa", categorias)?.name).toBe("Saúde");
    expect(matchCategory("salario", "receita", categorias)?.name).toBe("Salário");
  });

  it("match parcial - sugestão contém nome", () => {
    expect(matchCategory("Vendas online", "receita", categorias)?.name).toBe("Vendas");
    expect(matchCategory("Aluguel (Moradia)", "despesa", categorias)?.name).toBe("Moradia");
  });

  it("match parcial - nome contém sugestão", () => {
    expect(matchCategory("transp", "despesa", categorias)?.name).toBe("Transporte");
  });

  it("fallback para 'Outros' quando não encontra match", () => {
    const m = matchCategory("Categoria Inventada Pela IA", "despesa", categorias);
    expect(m?.name).toBe("Outros");
    expect(m?.id).toBe("outros-despesa");
  });

  it("fallback respeita o tipo (receita vs despesa)", () => {
    const m = matchCategory("Coisa Aleatória", "receita", categorias);
    expect(m?.name).toBe("Outros");
    expect(m?.id).toBe("outros-receita");
  });

  it("usa primeira categoria do tipo se não tiver 'Outros'", () => {
    const semOutros = categorias.filter((c) => c.name !== "Outros");
    const m = matchCategory("Inventada", "despesa", semOutros);
    expect(m?.name).toBe("Moradia");
  });

  it("retorna null se não houver categorias do tipo", () => {
    const apenasReceita = categorias.filter((c) => c.type === "receita");
    expect(matchCategory("Qualquer", "despesa", apenasReceita)).toBeNull();
  });

  it("ignora categorias de tipo diferente no match", () => {
    // "Vendas" existe mas é receita, não pode matchar como despesa
    const m = matchCategory("Vendas", "despesa", categorias);
    expect(m?.name).toBe("Outros");
  });
});
