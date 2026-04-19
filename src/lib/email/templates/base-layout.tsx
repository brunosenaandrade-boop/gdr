import type { ReactNode } from "react";

// ===== Sub-componentes reutilizáveis =====

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ margin: "28px 0" }}>
      <tr>
        <td align="center">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "14px 36px",
              background: "linear-gradient(135deg, #059669, #10B981)",
              backgroundColor: "#10B981",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
              borderRadius: "9999px",
              letterSpacing: "-0.2px",
            }}
          >
            {children}
          </a>
        </td>
      </tr>
    </table>
  );
}

export function EmailHeading({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        color: "#F1F5F9",
        fontSize: "22px",
        fontWeight: 700,
        margin: "0 0 16px",
        letterSpacing: "-0.3px",
        lineHeight: "1.3",
      }}
    >
      {children}
    </h2>
  );
}

export function EmailText({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <p
      style={{
        color: "#94A3B8",
        fontSize: "15px",
        lineHeight: "1.7",
        margin: "0 0 16px",
        ...style,
      }}
    >
      {children}
    </p>
  );
}

export function EmailDivider() {
  return (
    <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
      <tr>
        <td style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "24px", paddingBottom: "8px" }} />
      </tr>
    </table>
  );
}

export function InfoCard({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <table
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      role="presentation"
      style={{
        backgroundColor: "#1a1a1a",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.06)",
        margin: "20px 0",
      }}
    >
      {rows.map((row, i) => (
        <tr key={i}>
          <td
            style={{
              padding: i === 0 ? "16px 20px 8px" : i === rows.length - 1 ? "8px 20px 16px" : "8px 20px",
              color: "#64748B",
              fontSize: "13px",
              fontWeight: 500,
              width: "40%",
              verticalAlign: "top",
            }}
          >
            {row.label}
          </td>
          <td
            style={{
              padding: i === 0 ? "16px 20px 8px" : i === rows.length - 1 ? "8px 20px 16px" : "8px 20px",
              color: "#E2E8F0",
              fontSize: "14px",
              fontWeight: 600,
              verticalAlign: "top",
            }}
          >
            {row.value}
          </td>
        </tr>
      ))}
    </table>
  );
}

export function BulletItem({ children }: { children: ReactNode }) {
  return (
    <tr>
      <td style={{ width: "24px", color: "#10B981", fontSize: "14px", verticalAlign: "top", paddingBottom: "8px" }}>
        ●
      </td>
      <td style={{ color: "#94A3B8", fontSize: "14px", lineHeight: "1.6", paddingBottom: "8px" }}>{children}</td>
    </tr>
  );
}

// ===== Layout principal =====

interface BaseLayoutProps {
  preview?: string;
  children: ReactNode;
}

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <title>Guarda Dinheiro</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#000000",
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          WebkitTextSizeAdjust: "100%",
        }}
      >
        {/* Preview text (hidden) */}
        {preview && (
          <div
            style={{
              display: "none",
              maxHeight: 0,
              overflow: "hidden",
              fontSize: "1px",
              lineHeight: "1px",
              color: "#000000",
            }}
          >
            {preview}
            {"‌ ".repeat(40)}
          </div>
        )}

        {/* Outer wrapper */}
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          role="presentation"
          style={{ backgroundColor: "#000000" }}
        >
          <tr>
            <td align="center" style={{ padding: "40px 16px" }}>
              {/* Inner card */}
              <table
                width="600"
                cellPadding={0}
                cellSpacing={0}
                role="presentation"
                style={{
                  maxWidth: "600px",
                  width: "100%",
                  backgroundColor: "#0f0f0f",
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <tr>
                  <td
                    align="center"
                    style={{
                      padding: "32px 40px 24px",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div style={{ fontSize: "36px", lineHeight: "1" }}>🛡️</div>
                    <h1
                      style={{
                        color: "#10B981",
                        fontSize: "18px",
                        fontWeight: 700,
                        margin: "10px 0 0",
                        letterSpacing: "1.5px",
                        textTransform: "uppercase" as const,
                      }}
                    >
                      GUARDA DINHEIRO
                    </h1>
                  </td>
                </tr>

                {/* Content */}
                <tr>
                  <td style={{ padding: "32px 40px" }}>{children}</td>
                </tr>

                {/* Footer */}
                <tr>
                  <td
                    align="center"
                    style={{
                      padding: "24px 40px 32px",
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <p style={{ color: "#64748B", fontSize: "12px", margin: "0 0 6px", lineHeight: "1.5" }}>
                      Guarda Dinheiro — Seu assistente financeiro pessoal
                    </p>
                    <p style={{ color: "#475569", fontSize: "11px", margin: "0 0 6px", lineHeight: "1.5" }}>
                      guardadinheiro.com.br · contato@guardadinheiro.com.br
                    </p>
                    <p style={{ color: "#475569", fontSize: "11px", margin: "0", lineHeight: "1.5" }}>
                      Em conformidade com a LGPD (Lei 13.709/2018)
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}
