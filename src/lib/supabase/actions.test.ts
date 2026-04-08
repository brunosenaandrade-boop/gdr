import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock do Supabase server client
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockResolvedValue({ error: null });
const mockDeleteFn = vi.fn().mockResolvedValue({ error: null });
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: { id: "tenant-123" }, error: null });

const mockEq = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    maybeSingle: mockMaybeSingle,
  }),
  maybeSingle: mockMaybeSingle,
  update: mockUpdate,
  delete: mockDeleteFn,
});

vi.mock("./server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
        eq: mockEq,
      }),
      insert: mockInsert,
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
    },
  }),
}));

describe("Server Actions - validacao de entrada", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createTransaction rejeita amount negativo", async () => {
    const { createTransaction } = await import("./actions");
    const result = await createTransaction({
      type: "despesa",
      description: "Teste",
      amount: -100,
      category_id: null,
      due_date: null,
      paid_date: null,
      status: "pendente",
      notes: null,
    });
    expect(result.error).toBeDefined();
  });

  it("createTransaction rejeita amount zero", async () => {
    const { createTransaction } = await import("./actions");
    const result = await createTransaction({
      type: "despesa",
      description: "Teste",
      amount: 0,
      category_id: null,
      due_date: null,
      paid_date: null,
      status: "pendente",
      notes: null,
    });
    expect(result.error).toBeDefined();
  });

  it("createTransaction rejeita descricao vazia", async () => {
    const { createTransaction } = await import("./actions");
    const result = await createTransaction({
      type: "despesa",
      description: "",
      amount: 1000,
      category_id: null,
      due_date: null,
      paid_date: null,
      status: "pendente",
      notes: null,
    });
    expect(result.error).toBeDefined();
  });

  it("createTransaction rejeita tipo invalido", async () => {
    const { createTransaction } = await import("./actions");
    const result = await createTransaction({
      type: "invalido" as any,
      description: "Teste",
      amount: 1000,
      category_id: null,
      due_date: null,
      paid_date: null,
      status: "pendente",
      notes: null,
    });
    expect(result.error).toBeDefined();
  });

  it("createTransaction rejeita status invalido", async () => {
    const { createTransaction } = await import("./actions");
    const result = await createTransaction({
      type: "despesa",
      description: "Teste",
      amount: 1000,
      category_id: null,
      due_date: null,
      paid_date: null,
      status: "xyz" as any,
      notes: null,
    });
    expect(result.error).toBeDefined();
  });

  it("createCategory rejeita nome vazio", async () => {
    const { createCategory } = await import("./actions");
    const result = await createCategory({
      name: "",
      type: "despesa",
      color: null,
    });
    expect(result.error).toBeDefined();
  });

  it("createCategory rejeita tipo invalido", async () => {
    const { createCategory } = await import("./actions");
    const result = await createCategory({
      name: "Teste",
      type: "invalido" as any,
      color: null,
    });
    expect(result.error).toBeDefined();
  });
});

describe("Server Actions - validacao de limites", () => {
  it("createTransaction aceita dados validos", async () => {
    const { createTransaction } = await import("./actions");
    const result = await createTransaction({
      type: "despesa",
      description: "Conta de luz",
      amount: 15000,
      category_id: null,
      due_date: "2026-04-15",
      paid_date: null,
      status: "pendente",
      notes: "Mes de abril",
    });
    // Pode dar erro de mock, mas nao deve ser erro de validacao
    // Se o mock responder corretamente, nao tem erro
    expect(result.error).toBeUndefined();
  });

  it("createCategory aceita dados validos", async () => {
    const { createCategory } = await import("./actions");
    const result = await createCategory({
      name: "Alimentacao",
      type: "despesa",
      color: "#f87171",
    });
    expect(result.error).toBeUndefined();
  });
});
