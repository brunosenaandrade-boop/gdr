import { describe, it, expect } from "vitest";
import { isAppointment, isAgendaQuery } from "./appointment-intent";

describe("isAppointment", () => {
  it("detecta compromisso com keyword + horário", () => {
    expect(isAppointment("Tenho médico amanhã às 16h")).toBe(true);
    expect(isAppointment("Reunião sexta às 10h")).toBe(true);
    expect(isAppointment("Consulta no dentista hoje 14h30")).toBe(true);
    expect(isAppointment("Aniversário da Ana dia 20")).toBe(true);
  });

  it("detecta compromisso com verbo de agendar + horário", () => {
    expect(isAppointment("Marca pra mim amanhã às 10h")).toBe(true);
    expect(isAppointment("Lembre-me quarta 15h")).toBe(true);
    expect(isAppointment("Agenda treino sábado 9h")).toBe(true);
  });

  it("não detecta transação financeira como compromisso", () => {
    expect(isAppointment("Paguei 150 no médico")).toBe(false);
    expect(isAppointment("Gastei 50 no mercado")).toBe(false);
    expect(isAppointment("Recebi 1000 do cliente")).toBe(false);
  });

  it("não detecta mensagens sem indicação temporal", () => {
    expect(isAppointment("Médico")).toBe(false);
    expect(isAppointment("Reunião com João")).toBe(false);
    expect(isAppointment("Tenho compromisso")).toBe(false);
  });

  it("não detecta perguntas/consultas", () => {
    expect(isAppointment("Qual meu saldo?")).toBe(false);
    expect(isAppointment("Quanto gastei esse mês?")).toBe(false);
  });

  it("detecta formato de data numérica", () => {
    expect(isAppointment("Consulta dia 25/04 às 10h")).toBe(true);
    expect(isAppointment("Reunião 15/05 14h")).toBe(true);
  });

  it("aceita horário informal tipo meio-dia", () => {
    expect(isAppointment("Almoço amanhã meio-dia")).toBe(true);
  });

  it("detecta tempos relativos (daqui a X minutos/horas)", () => {
    expect(isAppointment("Me lembre daqui a 30 minutos de comprar lanche")).toBe(true);
    expect(isAppointment("Reunião daqui a 1 hora")).toBe(true);
    expect(isAppointment("Me lembre em 15 minutos")).toBe(true);
    expect(isAppointment("Dentista daqui a pouco")).toBe(true);
  });

  it("detecta períodos do dia (à tarde, à noite, de manhã)", () => {
    expect(isAppointment("Médico amanhã à tarde")).toBe(true);
    expect(isAppointment("Reunião à noite")).toBe(true);
    expect(isAppointment("Consulta de manhã")).toBe(true);
  });
});

describe("isAgendaQuery", () => {
  it("detecta perguntas sobre agenda", () => {
    expect(isAgendaQuery("O que tenho hoje?")).toBe(true);
    expect(isAgendaQuery("O que tenho amanhã?")).toBe(true);
    expect(isAgendaQuery("Quais meus compromissos?")).toBe(true);
    expect(isAgendaQuery("Minha agenda")).toBe(true);
    expect(isAgendaQuery("Ver minha agenda")).toBe(true);
    expect(isAgendaQuery("Tenho algum compromisso hoje?")).toBe(true);
    expect(isAgendaQuery("Compromissos de hoje")).toBe(true);
  });

  it("não detecta criação como consulta", () => {
    expect(isAgendaQuery("Tenho médico amanhã às 16h")).toBe(false);
    expect(isAgendaQuery("Marca reunião sexta")).toBe(false);
  });

  it("não detecta consultas financeiras", () => {
    expect(isAgendaQuery("Qual meu saldo?")).toBe(false);
    expect(isAgendaQuery("Quanto gastei?")).toBe(false);
  });
});
