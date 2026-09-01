import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "DuitKu — Catat Duit, Jelas Hidup";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#faf9f7",
          padding: 48,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.5, color: "#1a1a1a" }}>duitku.</span>
          <span style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#6b6b6b", border: "1px solid #e6e3df", borderRadius: 999, padding: "6px 12px", background: "#fff" }}>paper / ink / hairline</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1, letterSpacing: -1.5, color: "#1a1a1a" }}>Catat Duit,<br />Jelas Hidup.</div>
          <div style={{ fontSize: 18, color: "#6b6b6b", lineHeight: 1.4, maxWidth: 560 }}>Multi-dompet · budgeting · tujuan nabung. Kelola uang tanpa ribet — warm, minimal, cepat.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ fontSize: 13, color: "#1a1a1a", background: "#fff", border: "1px solid #e6e3df", borderRadius: 999, padding: "8px 14px" }}>Cash</span>
            <span style={{ fontSize: 13, color: "#1a1a1a", background: "#fff", border: "1px solid #e6e3df", borderRadius: 999, padding: "8px 14px" }}>Bank</span>
            <span style={{ fontSize: 13, color: "#1a1a1a", background: "#fff", border: "1px solid #e6e3df", borderRadius: 999, padding: "8px 14px" }}>eWallet</span>
            <span style={{ fontSize: 13, color: "#fff", background: "#1a1a1a", border: "1px solid #1a1a1a", borderRadius: 999, padding: "8px 14px" }}>Transfer riskan-aware</span>
          </div>
          <span style={{ fontSize: 12, color: "#8f8b85" }}>duitku.app</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
