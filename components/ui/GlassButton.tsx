/**
 * The game's one button, in four levels: primary (filled navy, one per screen),
 * secondary (glass), quiet (text only, for Leave / Back / Skip) and icon (44px glass square).
 */
import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { color, font, glassSurfaceSmall, radius, size, text } from "./tokens";

/** Visual weight of a button; pick the lightest that fits so the primary stands out. */
export type GlassButtonVariant = "primary" | "secondary" | "quiet" | "icon";

const base: CSSProperties = {
  ...text.button,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  boxSizing: "border-box",
  textDecoration: "none",
  whiteSpace: "nowrap",
  cursor: "pointer",
  pointerEvents: "auto",
  transition: "opacity 0.3s ease, transform 0.1s ease",
};

const variants: Record<GlassButtonVariant, CSSProperties> = {
  primary: {
    height: size.control,
    padding: "0 28px",
    borderRadius: radius.pill,
    border: "none",
    background: color.navy,
    color: color.white,
    boxShadow: "0 4px 14px rgba(39,67,94,0.35)",
  },
  secondary: {
    height: size.control,
    padding: "0 24px",
    borderRadius: radius.pill,
    border: "1px solid rgba(30,41,59,0.15)",
    background: "rgba(255,255,255,0.7)",
    color: color.ink,
  },
  quiet: {
    height: size.minTarget,
    padding: "0 8px",
    border: "none",
    background: "transparent",
    color: color.body,
    fontSize: "0.875rem",
  },
  icon: {
    ...glassSurfaceSmall,
    width: size.minTarget,
    height: size.minTarget,
    padding: 0,
    borderRadius: radius.md,
    color: color.ink,
    lineHeight: 0,
  },
};

/**
 * Style object for a button variant, for elements that can't be a `<button>` (e.g. a Next `<Link>`).
 * @param variant - Button level.
 * @param disabled - Dims the button and drops the pointer cursor.
 * @returns Inline style for the element.
 * @example
 * <Link href="/multiplayer" style={glassButtonStyle("secondary")}>MULTIPLAYER</Link>
 */
export function glassButtonStyle(variant: GlassButtonVariant, disabled = false): CSSProperties {
  return {
    ...base,
    ...variants[variant],
    fontFamily: font.ui,
    ...(disabled ? { opacity: 0.45, cursor: "default" } : null),
  };
}

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Defaults to secondary; use primary for the screen's main action only. */
  variant?: GlassButtonVariant;
}

/**
 * @param props - Button attributes plus `variant`; `style` is merged over the variant style.
 * @example
 * <GlassButton variant="primary" onClick={start}>START RIDE</GlassButton>
 * <GlassButton variant="icon" aria-label="Pause" onClick={pause}><PauseIcon /></GlassButton>
 */
export function GlassButton({ variant = "secondary", style, type = "button", disabled, ...rest }: GlassButtonProps) {
  return <button type={type} disabled={disabled} style={{ ...glassButtonStyle(variant, disabled), ...style }} {...rest} />;
}
