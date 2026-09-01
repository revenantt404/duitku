import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a1a",
          borderRadius: 96,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 120, fontWeight: 700, letterSpacing: -4, color: "#faf9f7", lineHeight: 1 }}>d.</span>
          <span style={{ fontSize: 16, letterSpacing: 6, textTransform: "uppercase", color: "#a7a39d" }}>DUITKU</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
