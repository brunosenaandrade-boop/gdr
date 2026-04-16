import { describe, it, expect } from "vitest";
import { calculateFromData, classifyTier } from "./calculate";

const baseTenantCreated = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString(); // 12m

describe("classifyTier", () => {
  it("retorna faixas corretas", () => {
    expect(classifyTier(100).tier).toBe("muito_baixo");
    expect(classifyTier(400).tier).toBe("baixo");
    expect(classifyTier(600).tier).toBe("regular");
    expect(classifyTier(750).tier).toBe("bom");
    expect(classifyTier(900).tier).toBe("excelente");
  });
});

describe("calculateFromData", () => {
  it("usuário ideal: score alto (>=850)", () => {
    const txs: any[] = [];
    // 4 tx/semana por 30 dias (~17 total) + receitas > despesas
    const now = Date.now();
    for (let i = 0; i < 17; i++) {
      txs.push({
        type: i % 3 === 0 ? "receita" : "despesa",
        amount: i % 3 === 0 ? 5000 : 1000,
        status: "pago",
        category_id: `cat-${i % 5}`,
        due_date: null,
        paid_date: null,
        created_at: new Date(now - i * 24 * 3600 * 1000).toISOString(),
      });
    }
    // 6m histórico positivo em cada mês
    const txs6m: any[] = [];
    for (let m = 0; m < 6; m++) {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - m, 15).toISOString();
      txs6m.push({ type: "receita", amount: 10000, status: "pago", category_id: "a", due_date: null, paid_date: null, created_at: d });
      txs6m.push({ type: "despesa", amount: 5000, status: "pago", category_id: "b", due_date: null, paid_date: null, created_at: d });
    }

    const r = calculateFromData({
      tenantCreatedAt: baseTenantCreated,
      transactionsLast30d: txs,
      transactionsLast6m: txs6m,
      overdueCount: 0,
      recurringCount: 5,
    });
    expect(r.score).toBeGreaterThanOrEqual(850);
    expect(r.tier).toBe("excelente");
  });

  it("usuário novo sem dados: score baixo", () => {
    const r = calculateFromData({
      tenantCreatedAt: new Date().toISOString(),
      transactionsLast30d: [],
      transactionsLast6m: [],
      overdueCount: 0,
      recurringCount: 0,
    });
    // Sem receita, sem atraso, sem constância → só pontualidade (200)
    expect(r.score).toBe(200);
    expect(r.tier).toBe("muito_baixo");
  });

  it("penaliza contas atrasadas", () => {
    const r = calculateFromData({
      tenantCreatedAt: baseTenantCreated,
      transactionsLast30d: [],
      transactionsLast6m: [],
      overdueCount: 4, // -200
      recurringCount: 0,
    });
    expect(r.breakdown.pontualidade).toBe(0);
  });

  it("clampa score máximo em 1000", () => {
    const txs: any[] = [];
    const now = Date.now();
    for (let i = 0; i < 50; i++) {
      txs.push({
        type: i % 2 === 0 ? "receita" : "despesa",
        amount: i % 2 === 0 ? 10000 : 100,
        status: "pago",
        category_id: `cat-${i % 10}`,
        due_date: null,
        paid_date: null,
        created_at: new Date(now - i * 6 * 3600 * 1000).toISOString(),
      });
    }
    const r = calculateFromData({
      tenantCreatedAt: baseTenantCreated,
      transactionsLast30d: txs,
      transactionsLast6m: txs,
      overdueCount: 0,
      recurringCount: 10,
    });
    expect(r.score).toBeLessThanOrEqual(1000);
  });

  it("breakdown soma corresponde ao score final", () => {
    const r = calculateFromData({
      tenantCreatedAt: baseTenantCreated,
      transactionsLast30d: [],
      transactionsLast6m: [],
      overdueCount: 1,
      recurringCount: 2,
    });
    const sum = Object.values(r.breakdown).reduce((s, v) => s + v, 0);
    expect(r.score).toBe(Math.max(0, Math.min(1000, sum)));
  });
});
