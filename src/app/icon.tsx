import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #34D399, #059669)",
        }}
      >
        {/* Escudo simplificado com formas CSS */}
        <div
          style={{
            width: 16,
            height: 18,
            borderRadius: "3px 3px 8px 8px",
            border: "2px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "white",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
