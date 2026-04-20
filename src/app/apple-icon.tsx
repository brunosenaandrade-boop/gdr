import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "20%",
          background: "linear-gradient(135deg, #34D399, #059669)",
        }}
      >
        <div
          style={{
            width: 90,
            height: 100,
            borderRadius: "12px 12px 45px 45px",
            border: "10px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
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
