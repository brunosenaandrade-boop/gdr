import { describe, it, expect } from "vitest";
import { isConfirmation, isCancellation } from "./intent";

describe("isConfirmation", () => {
  it("detecta confirmações simples", () => {
    expect(isConfirmation("sim")).toBe(true);
    expect(isConfirmation("Sim")).toBe(true);
    expect(isConfirmation("S")).toBe(true);
    expect(isConfirmation("ok")).toBe(true);
    expect(isConfirmation("beleza")).toBe(true);
    expect(isConfirmation("confirmar")).toBe(true);
    expect(isConfirmation("confirma")).toBe(true);
    expect(isConfirmation("pode lançar")).toBe(true);
    expect(isConfirmation("pode lancar")).toBe(true);
  });

  it("detecta confirmações no final de frases", () => {
    expect(isConfirmation("Então, é, foi isso mesmo, eu recebi 1.440, pode lançar.")).toBe(true);
    expect(isConfirmation("Recebi 500 do João, confirma")).toBe(true);
    expect(isConfirmation("Paguei, sim")).toBe(true);
    expect(isConfirmation("Foi isso mesmo, ok")).toBe(true);
  });

  it("não confirma mensagens com descrição de lançamento", () => {
    expect(isConfirmation("Recebi 500 do João")).toBe(false);
    expect(isConfirmation("Paguei 150 reais de luz")).toBe(false);
    expect(isConfirmation("Comprei café")).toBe(false);
  });

  it("não confirma quando apenas menciona 'sim' no meio", () => {
    expect(isConfirmation("Sim, recebi 500 do João")).toBe(false);
  });
});

describe("isCancellation", () => {
  it("detecta cancelamentos simples", () => {
    expect(isCancellation("não")).toBe(true);
    expect(isCancellation("nao")).toBe(true);
    expect(isCancellation("N")).toBe(true);
    expect(isCancellation("cancelar")).toBe(true);
    expect(isCancellation("cancela")).toBe(true);
    expect(isCancellation("esquece")).toBe(true);
    expect(isCancellation("deixa pra lá")).toBe(true);
  });

  it("detecta cancelamentos no final de frases", () => {
    expect(isCancellation("Ah, espera, não")).toBe(true);
    expect(isCancellation("Calma, cancela")).toBe(true);
    expect(isCancellation("Puts, esquece")).toBe(true);
  });

  it("não cancela quando mensagem descreve lançamento", () => {
    expect(isCancellation("Recebi 500")).toBe(false);
    expect(isCancellation("Paguei 150 de luz")).toBe(false);
  });
});
