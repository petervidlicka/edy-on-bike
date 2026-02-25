import { CSSProperties } from "react";

export const glassBtn: CSSProperties = {
  padding: "0.55rem 1.5rem",
  borderRadius: "20px",
  border: "1.5px solid rgba(255,255,255,0.55)",
  fontSize: "0.9rem",
  fontWeight: 700,
  fontFamily: "var(--font-nunito), Arial, sans-serif",
  letterSpacing: "0.04em",
  cursor: "pointer",
  pointerEvents: "auto",
  background: "rgba(255,255,255,0.25)",
  backdropFilter: "blur(24px) saturate(200%)",
  WebkitBackdropFilter: "blur(24px) saturate(200%)",
  color: "#1e293b",
  boxShadow:
    "0 2px 16px rgba(0,0,0,0.1), inset 0 1.5px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.04)",
};
