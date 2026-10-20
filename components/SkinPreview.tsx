"use client";

/**
 * Canvas preview of a bike skin, shared by the skin picker cards and the lobby's rider
 * list so both draw the same art at the same backing size.
 */
import { useEffect, useRef, type CSSProperties } from "react";
import type { SkinDefinition } from "@/game/types";
import { drawSkinPreview } from "@/game/rendering";

/** Backing-store size the preview art is drawn at; scale it on screen with `style`. */
export const SKIN_PREVIEW_W = 72;
export const SKIN_PREVIEW_H = 79;

/**
 * @param props - The skin to draw, and the on-screen style (size, dimming).
 * @example
 * <SkinPreview skin={getSkinById("default")} style={{ width: 36, height: 40 }} />
 */
export function SkinPreview({ skin, style }: { skin: SkinDefinition; style?: CSSProperties }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawSkinPreview(ctx, skin, SKIN_PREVIEW_W, SKIN_PREVIEW_H);
  }, [skin]);

  return (
    <canvas
      ref={canvasRef}
      width={SKIN_PREVIEW_W}
      height={SKIN_PREVIEW_H}
      aria-hidden="true"
      style={{ imageRendering: "pixelated", ...style }}
    />
  );
}
