/**
 * Design tokens for every UI overlay (menus, HUD, lobby). One source for colour,
 * type, radii, spacing and the frosted-glass surface, so screens stop drifting apart.
 * Mirrors the "Proposed UI tokens" board on the design canvas.
 */
import type { CSSProperties } from "react";

/** Colour roles. Text colours all pass 4.5:1 on the glass surface over the sky. */
export const color = {
  /** Titles and the primary button fill. */
  navy: "#27435E",
  /** Default text and icons. */
  ink: "#1e293b",
  /** Body copy. */
  body: "#334155",
  /** Labels and secondary text; the lightest grey allowed for small text. */
  muted: "#475569",
  /** Clean tricks, ready states. */
  success: "#15803d",
  successBg: "#dcfce7",
  /** Sketchy tricks. */
  caution: "#b45309",
  /** Badges such as "New personal best". */
  warnBg: "#fef3c7",
  warnInk: "#92400e",
  danger: "#b91c1c",
  /** First-place medal. */
  gold: "#fbbf24",
  white: "#ffffff",
} as const;

/** Font stacks, backed by the next/font variables set in app/layout.tsx. */
export const font = {
  display: "var(--font-fredoka), sans-serif",
  ui: "var(--font-nunito), Arial, sans-serif",
  /** Every number: scores, multipliers, room codes. */
  mono: "var(--font-space-mono), monospace",
} as const;

/** Corner radii: small (badges, inputs), medium (chips, cards), large (panels), pill (buttons). */
export const radius = { sm: "10px", md: "14px", lg: "24px", pill: "999px" } as const;

/** Spacing steps in px. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Button height, and the smallest tappable size for anything else. */
export const size = { control: 48, minTarget: 44 } as const;

const blur = "blur(24px) saturate(180%)";

/** The frosted-glass surface behind every menu panel and HUD chip. */
export const glassSurface: CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: blur,
  WebkitBackdropFilter: blur,
  border: "1px solid rgba(255,255,255,0.7)",
  boxShadow: "0 8px 32px rgba(15,23,42,0.14)",
};

/** Lighter shadow for small glass elements (HUD chips, icon buttons). */
export const glassSurfaceSmall: CSSProperties = {
  ...glassSurface,
  boxShadow: "0 4px 16px rgba(15,23,42,0.1)",
};

/** The seven type styles. Titles are Title Case; caps only on buttons and labels. */
export const text = {
  display: {
    fontFamily: font.display,
    fontWeight: 600,
    fontSize: "clamp(1.6rem, 7vh, 2.75rem)",
    lineHeight: 1.1,
    letterSpacing: "0.02em",
    color: color.navy,
    margin: 0,
  },
  title: {
    fontFamily: font.display,
    fontWeight: 600,
    fontSize: "1.5rem",
    lineHeight: 1.2,
    color: color.navy,
    margin: 0,
  },
  body: { fontFamily: font.ui, fontWeight: 600, fontSize: "1rem", color: color.body, margin: 0 },
  button: { fontFamily: font.ui, fontWeight: 800, fontSize: "0.95rem", letterSpacing: "0.06em", textTransform: "uppercase" },
  label: {
    fontFamily: font.ui,
    fontWeight: 700,
    fontSize: "0.75rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: color.muted,
    margin: 0,
  },
  numberXl: { fontFamily: font.mono, fontWeight: 700, fontSize: "clamp(1.75rem, 8vh, 3rem)", lineHeight: 1, color: color.ink },
  number: { fontFamily: font.mono, fontWeight: 700, fontSize: "1.5rem", lineHeight: 1, color: color.ink },
} satisfies Record<string, CSSProperties>;

/** Small rounded badge ("New personal best", "Ready", "OUT"). */
export const badge: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: space.xs,
  padding: "4px 10px",
  borderRadius: radius.sm,
  fontFamily: font.ui,
  fontSize: "0.8rem",
  fontWeight: 800,
};

/** Highlight badge for achievements ("New personal best", "You made the top 10"). */
export const badgeWarn: CSSProperties = { ...badge, background: color.warnBg, color: color.warnInk };

/** Text input on a glass panel. */
export const input: CSSProperties = {
  height: size.control,
  boxSizing: "border-box",
  padding: "0 16px",
  borderRadius: "12px",
  border: "1px solid rgba(30,41,59,0.2)",
  background: "rgba(255,255,255,0.9)",
  color: color.ink,
  fontFamily: font.ui,
  fontSize: "1rem",
  fontWeight: 600,
  outline: "none",
  minWidth: 0,
};

/** Pads a score to the game's five-digit display. */
export function formatScore(score: number): string {
  return String(score).padStart(5, "0");
}
