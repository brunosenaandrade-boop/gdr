import { describe, it, expect } from "vitest";
import { todayBRT, getHoursBRT, formatTimeBRT, getDayOfMonthBRT, todayRangeBRT, formatDateTimeBRT } from "./brt";

describe("todayBRT", () => {
  it("retorna formato YYYY-MM-DD", () => {
    const result = todayBRT(new Date("2026-04-18T02:00:00Z")); // 23h BRT do dia 17
    expect(result).toBe("2026-04-17"); // ainda é dia 17 em BRT
  });

  it("retorna dia correto quando UTC já virou", () => {
    const result = todayBRT(new Date("2026-04-18T04:00:00Z")); // 01h BRT do dia 18
    expect(result).toBe("2026-04-18");
  });
});

describe("getHoursBRT", () => {
  it("converte ISO com offset -03:00 corretamente", () => {
    const { hours, minutes } = getHoursBRT("2026-04-18T16:30:00-03:00");
    expect(hours).toBe(16);
    expect(minutes).toBe(30);
  });

  it("converte UTC pra BRT (-3h)", () => {
    const { hours } = getHoursBRT("2026-04-18T19:00:00Z"); // 19h UTC = 16h BRT
    expect(hours).toBe(16);
  });

  it("trata meia-noite corretamente", () => {
    const { hours } = getHoursBRT("2026-04-18T03:00:00Z"); // 03h UTC = 00h BRT
    expect(hours).toBe(0);
  });
});

describe("formatTimeBRT", () => {
  it("formata como HHhMM", () => {
    expect(formatTimeBRT("2026-04-18T16:05:00-03:00")).toBe("16h05");
    expect(formatTimeBRT("2026-04-18T09:00:00-03:00")).toBe("09h00");
  });
});

describe("getDayOfMonthBRT", () => {
  it("retorna dia correto em BRT", () => {
    // 02h UTC dia 18 = 23h BRT dia 17
    expect(getDayOfMonthBRT(new Date("2026-04-18T02:00:00Z"))).toBe(17);
    // 04h UTC dia 18 = 01h BRT dia 18
    expect(getDayOfMonthBRT(new Date("2026-04-18T04:00:00Z"))).toBe(18);
  });
});

describe("todayRangeBRT", () => {
  it("retorna range com offset -03:00", () => {
    const range = todayRangeBRT(new Date("2026-04-18T15:00:00Z")); // 12h BRT
    expect(range.start).toBe("2026-04-18T00:00:00-03:00");
    expect(range.end).toBe("2026-04-18T23:59:59-03:00");
  });
});

describe("formatDateTimeBRT", () => {
  it("formata como DD/MM às HHhMM", () => {
    const result = formatDateTimeBRT("2026-04-18T16:30:00-03:00");
    expect(result).toBe("18/04 às 16h30");
  });
});
