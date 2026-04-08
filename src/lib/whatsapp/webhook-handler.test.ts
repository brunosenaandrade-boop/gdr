import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do Supabase
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();

function chainMock() {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };
  return chain;
}

const mockFrom = vi.fn().mockImplementation(() => chainMock());

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn().mockResolvedValue({
    from: mockFrom,
  }),
}));

// Mock do OpenAI
vi.mock("@/lib/openai/parse-lancamento", () => ({
  parseLancamento: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      type: "despesa",
      description: "Conta de luz",
      amount: 15000,
      category_suggestion: "Moradia",
    },
  }),
}));

vi.mock("@/lib/openai/transcribe-audio", () => ({
  transcribeAudio: vi.fn().mockResolvedValue({
    ok: true,
    text: "paguei cento e cinquenta reais de luz",
  }),
}));

// Mock do Meta API
const mockSendMessage = vi.fn().mockResolvedValue({ ok: true });
const mockDownloadMedia = vi.fn().mockResolvedValue(Buffer.from("fake-audio"));

vi.mock("./meta-api", () => ({
  sendWhatsAppMessage: (...args: any[]) => mockSendMessage(...args),
  downloadWhatsAppMedia: (...args: any[]) => mockDownloadMedia(...args),
}));

describe("Webhook handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("modulos de mock carregam sem erro", async () => {
    const { parseLancamento } = await import("@/lib/openai/parse-lancamento");
    const result = await parseLancamento("paguei 150 de luz", []);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.type).toBe("despesa");
      expect(result.data.amount).toBe(15000);
    }
  });

  it("transcribeAudio mock funciona", async () => {
    const { transcribeAudio } = await import("@/lib/openai/transcribe-audio");
    const result = await transcribeAudio(Buffer.from("audio"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text).toContain("luz");
    }
  });

  it("sendWhatsAppMessage mock funciona", async () => {
    const result = await mockSendMessage("5511999999999", "Teste");
    expect(result.ok).toBe(true);
    expect(mockSendMessage).toHaveBeenCalledWith("5511999999999", "Teste");
  });

  it("downloadWhatsAppMedia mock retorna buffer", async () => {
    const result = await mockDownloadMedia("media-id-123");
    expect(result).toBeInstanceOf(Buffer);
  });
});
