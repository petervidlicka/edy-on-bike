/**
 * The frosted panel every menu sits on, so text stays readable over the moving
 * game scene without each screen inventing its own backdrop.
 */
import type { HTMLAttributes } from "react";
import { glassSurface, radius } from "./tokens";

/**
 * A column of content on the glass surface. Pass `style` to change layout or padding.
 * @param props - Div attributes; `style` is merged over the panel style.
 * @example
 * <GlassPanel><ScreenTitle>Game Over</ScreenTitle>…</GlassPanel>
 */
export function GlassPanel({ style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        ...glassSurface,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "clamp(8px, 2vh, 16px)",
        padding: "clamp(12px, 3vh, 28px) clamp(18px, 4vw, 36px)",
        borderRadius: radius.lg,
        boxSizing: "border-box",
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "calc(100dvh - 16px)",
        overflowY: "auto",
        ...style,
      }}
      {...rest}
    />
  );
}
