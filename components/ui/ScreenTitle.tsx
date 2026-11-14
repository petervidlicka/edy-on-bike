/**
 * Screen and section headings in the one title style (Fredoka, navy, Title Case),
 * replacing the per-screen sizes, spacings and all-caps variants.
 */
import type { ReactNode } from "react";
import { text } from "./tokens";

interface ScreenTitleProps {
  children: ReactNode;
  /** `display` for the screen's main title, `section` for a heading inside a panel. */
  level?: "display" | "section";
  /** Heading element; defaults to h2 (the start screen passes h1). */
  as?: "h1" | "h2" | "h3";
}

/**
 * @param props - Title text, visual level and heading element.
 * @example
 * <ScreenTitle as="h1">Edy on Bike</ScreenTitle>
 * <ScreenTitle level="section" as="h3">Top scores</ScreenTitle>
 */
export function ScreenTitle({ children, level = "display", as: Tag = "h2" }: ScreenTitleProps) {
  return <Tag style={level === "display" ? text.display : text.title}>{children}</Tag>;
}
