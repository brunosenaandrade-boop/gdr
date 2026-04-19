import { describe, it, expect } from "vitest";

/**
 * Testes de segurança automatizados.
 * Baseados em auditorias de 3 projetos concorrentes (MeuAssessor, KDG, WinAds).
 *
 * Estes testes verificam padrões de segurança no código-fonte,
 * não fazem requests HTTP (isso requer ambiente de integração).
 */

describe("Webhook Mercado Pago — segurança", () => {
  it("tem rate limiting implementado", async () => {
    const code = await import("fs").then((fs) =>
      fs.readFileSync("src/app/api/webhooks/mercadopago/route.ts", "utf8"),
    );
    expect(code).toContain("isRateLimited");
    expect(code).toContain("RATE_LIMIT");
    expect(code).toContain("429");
  });

  it("sanitiza payment ID (só aceita números)", async () => {
    const code = await import("fs").then((fs) =>
      fs.readFileSync("src/app/api/webhooks/mercadopago/route.ts", "utf8"),
    );
    expect(code).toContain("replace(/\\D/g");
    expect(code).toContain("Invalid payment ID");
    expect(code).toContain("400");
  });

  it("valida pagamento na API oficial do MP antes de ativar", async () => {
    const code = await import("fs").then((fs) =>
      fs.readFileSync("src/app/api/webhooks/mercadopago/route.ts", "utf8"),
    );
    expect(code).toContain("payment.get");
    expect(code).toContain("Payment verification failed");
    expect(code).toContain("403");
  });

  it("tem idempotência por gateway_event_id", async () => {
    const code = await import("fs").then((fs) =>
      fs.readFileSync("src/app/api/webhooks/mercadopago/route.ts", "utf8"),
    );
    expect(code).toContain("gateway_event_id");
    expect(code).toContain("already_processed");
  });
});

describe("Webhook WhatsApp — segurança", () => {
  it("valida HMAC signature", async () => {
    const code = await import("fs").then((fs) =>
      fs.readFileSync("src/app/api/webhooks/whatsapp/route.ts", "utf8"),
    );
    expect(code).toContain("x-hub-signature-256");
    expect(code).toContain("timingSafeEqual");
    expect(code).toContain("createHmac");
  });

  it("tem rate limiting por IP", async () => {
    const code = await import("fs").then((fs) =>
      fs.readFileSync("src/app/api/webhooks/whatsapp/route.ts", "utf8"),
    );
    expect(code).toContain("isRateLimited");
    expect(code).toContain("429");
  });

  it("valida content-type e payload size", async () => {
    const code = await import("fs").then((fs) =>
      fs.readFileSync("src/app/api/webhooks/whatsapp/route.ts", "utf8"),
    );
    expect(code).toContain("content-type");
    expect(code).toContain("content-length");
    expect(code).toContain("413");
  });
});

describe("Middleware — rotas protegidas", () => {
  it("redireciona /dashboard pra /login sem sessão", async () => {
    const code = await import("fs").then((fs) =>
      fs.readFileSync("src/lib/supabase/middleware.ts", "utf8"),
    );
    expect(code).toContain('"/login"');
    expect(code).toContain('"/dashboard"');
    expect(code).toContain("redirect");
  });

  it("bloqueia /admin e /afiliado pelo domínio principal", async () => {
    const code = await import("fs").then((fs) =>
      fs.readFileSync("src/lib/supabase/middleware.ts", "utf8"),
    );
    expect(code).toContain('path.startsWith("/admin")');
    expect(code).toContain('path.startsWith("/afiliado")');
  });

  it("força logout se user/tenant deletado", async () => {
    const code = await import("fs").then((fs) =>
      fs.readFileSync("src/lib/supabase/middleware.ts", "utf8"),
    );
    expect(code).toContain("getUserById");
    expect(code).toContain("signOut");
  });
});

describe("Supabase RLS — tenant isolation", () => {
  it("todas as tabelas críticas têm RLS habilitado nas migrations", async () => {
    const fs = await import("fs");
    const migrations = fs.readdirSync("supabase/migrations").filter((f: string) => f.endsWith(".sql"));

    const allSql = migrations
      .map((f: string) => fs.readFileSync(`supabase/migrations/${f}`, "utf8"))
      .join("\n");

    // Tabelas que DEVEM ter RLS
    const tables = [
      "transactions",
      "categories",
      "tenants",
      "subscriptions",
      "appointments",
      "financial_scores",
      "recurring_transactions",
      "whatsapp_links",
    ];

    for (const table of tables) {
      expect(allSql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    }
  });

  it("políticas de tenant isolation usam get_tenant_id()", async () => {
    const fs = await import("fs");
    const migrations = fs.readdirSync("supabase/migrations").filter((f: string) => f.endsWith(".sql"));

    const allSql = migrations
      .map((f: string) => fs.readFileSync(`supabase/migrations/${f}`, "utf8"))
      .join("\n");

    // Deve ter políticas com get_tenant_id()
    expect(allSql).toContain("get_tenant_id()");
    // Contar quantas policies usam
    const policyCount = (allSql.match(/get_tenant_id\(\)/g) || []).length;
    expect(policyCount).toBeGreaterThanOrEqual(5);
  });
});

describe("Credenciais — não expostas no código", () => {
  it("sem API keys hardcoded em src/", async () => {
    const { execSync } = await import("child_process");
    const result = execSync(
      'grep -rn "APP_USR-\\|sk-proj-\\|sbp_" src/ --include="*.ts" --include="*.tsx" | grep -v "security.test.ts" || true',
      { encoding: "utf8" },
    );
    expect(result.trim()).toBe("");
  });

  it("arquivos .env estão no .gitignore", async () => {
    const fs = await import("fs");
    const gitignore = fs.readFileSync(".gitignore", "utf8");
    expect(gitignore).toMatch(/\.env\*/);
  });
});
