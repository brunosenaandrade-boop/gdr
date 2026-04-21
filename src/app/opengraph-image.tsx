import { ImageResponse } from "next/og";

export const alt = "Guarda Dinheiro — Controle financeiro no WhatsApp com IA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse at top, rgba(16, 185, 129, 0.18), transparent 60%), #000000",
          fontFamily: "sans-serif",
          padding: "80px",
        }}
      >
        {/* Brand mark: escudo emerald idêntico ao favicon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 160,
            height: 160,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, #34D399 0%, #10B981 50%, #059669 100%)",
            marginBottom: 40,
            boxShadow: "0 0 80px rgba(16, 185, 129, 0.5)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 76,
              height: 88,
              border: "10px solid #ffffff",
              borderRadius: "12px 12px 38px 38px",
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                backgroundColor: "#ffffff",
                borderRadius: "50%",
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            color: "#10B981",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          Guarda Dinheiro
        </div>

        <div
          style={{
            display: "flex",
            color: "#F1F5F9",
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: -1.5,
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: 1000,
          }}
        >
          Controle financeiro pelo WhatsApp com IA
        </div>

        <div
          style={{
            display: "flex",
            color: "#94A3B8",
            fontSize: 28,
            marginTop: 30,
            textAlign: "center",
          }}
        >
          Registre gastos por áudio · Receba lembretes · Painel completo
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 48,
            color: "#475569",
            fontSize: 20,
            display: "flex",
          }}
        >
          guardadinheiro.com.br
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
