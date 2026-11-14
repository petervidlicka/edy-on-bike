/**
 * Shared skeleton of the biome backdrops: a strip two and a half screens wide of
 * buildings ("fillers"), rarer landmarks, trees in between and the odd figure in a
 * gap. Biomes supply the tables; the loop, the strip length, the ground line, the
 * verge depth and the landmark spacing rule live here so those conventions cannot
 * drift apart between biomes. Generation uses Math.random: backdrops are cosmetic
 * and never part of the seeded multiplayer course.
 */
import type { BackgroundElement } from "../types";
import type { EnvironmentPalette } from "./types";

/** The strip is this many canvas widths long, so it covers the widest zoomed-out view with room to scroll. */
const STREET_SPAN = 2.5;
/** Buildings stand this far below the ground line, so their footing is hidden by the verge. */
const BUILDING_INSET = 16;
/** Trees and figures sit a random depth into the verge strip, up to this many px. */
const VERGE_DEPTH = 18;
/** Fillers that must pass between two landmarks. */
const MIN_FILLERS_BETWEEN_LANDMARKS = 3;

/** An element as a biome table produces it: everything but its position. */
export type StreetPiece<T extends string> = Pick<BackgroundElement<T>, "type" | "width" | "height" | "color" | "roofColor" | "variant">;

/** What kind of thing the previous slot put down, for rules like "no figure right after a figure". */
export interface StreetSlot<T extends string> {
  kind: "landmark" | "filler" | "tree" | "figure";
  type: T;
}

/**
 * A biome's backdrop tables. `T` is the biome's element-type union, `L` its landmark ids.
 * Each slot of the strip rolls once: a landmark (when allowed), else a filler, else a tree.
 */
export interface StreetConfig<T extends string, L extends string = never> {
  /** Rare set-pieces: never the same one twice running, and only after MIN_FILLERS_BETWEEN_LANDMARKS fillers. */
  landmarks?: {
    /** Share of slots that become a landmark when one is allowed. */
    chance: number;
    ids: readonly L[];
    /** Breathing room before and after, so a landmark stands apart from the fillers. */
    padBefore: number;
    padAfter: number;
    make(id: L, palette: EnvironmentPalette): StreetPiece<T>;
  };
  /** The ordinary buildings. */
  fillers: {
    /** Share of slots that are a landmark or a filler (the rest are trees); at least the landmark chance. */
    chance: number;
    /** `gap` is the space left after the building (negative packs them tighter). */
    make(palette: EnvironmentPalette): StreetPiece<T> & { gap: number };
  };
  /** Trees (or street lamps) planted on the verge between buildings. */
  trees: {
    /** Never two in a row: a second roll for a tree places a filler instead. */
    neverTwice?: boolean;
    /** `lift` is how far above the ground line it stands; `vergeOffset` is a random verge depth to use for it. */
    make(palette: EnvironmentPalette, vergeOffset: number): StreetPiece<T> & { gap: number; lift: number };
  };
  /** People, animals and flags that may follow a building, standing in its gap. */
  figures?: {
    /** Chance of a figure in the gap after a qualifying building. */
    chance: number;
    /** The gap must be strictly wider than this. */
    minGap?: number;
    /** Which buildings a figure may follow. */
    after: "filler" | "landmark";
    /** Whether a figure may come after what the previous slot put down (`null` at the start of the strip). */
    allowAfter(last: StreetSlot<T> | null): boolean;
    /** `back` is how far back from the end of the gap it stands; `lift` how far above the ground line. */
    make(palette: EnvironmentPalette, gap: number, vergeOffset: number): StreetPiece<T> & { back: number; lift: number };
  };
}

/** A piece put down at a position. */
function place<T extends string>(piece: StreetPiece<T>, x: number, y: number): BackgroundElement<T> {
  return { ...piece, x, y };
}

/**
 * Builds a biome's building-layer elements from its tables, left to right, until the
 * strip is STREET_SPAN screens long.
 * @param canvasWidth - Screen width the strip is sized from.
 * @param groundY - The ground line everything stands on.
 * @param palette - Colours for the pieces.
 * @param cfg - The biome's tables.
 * @example
 * generateElements: (w, g, p) => generateStreet(w, g, p, SUBURBAN_STREET)
 */
export function generateStreet<T extends string, L extends string>(
  canvasWidth: number,
  groundY: number,
  palette: EnvironmentPalette,
  cfg: StreetConfig<T, L>,
): BackgroundElement<T>[] {
  const { landmarks, fillers, trees, figures } = cfg;
  const elements: BackgroundElement<T>[] = [];
  let x = 0;
  let last: StreetSlot<T> | null = null;
  let lastLandmark: L | null = null;
  let fillersSinceLandmark = MIN_FILLERS_BETWEEN_LANDMARKS; // a landmark may come first

  /** Maybe stands a figure in the gap just left after a building; returns its slot if it did. */
  const figureAfter = (building: "filler" | "landmark", gap: number): StreetSlot<T> | null => {
    if (!figures || figures.after !== building) return null;
    if (figures.minGap !== undefined && gap <= figures.minGap) return null;
    if (Math.random() >= figures.chance || !figures.allowAfter(last)) return null;
    const { back, lift, ...piece } = figures.make(palette, gap, Math.random() * VERGE_DEPTH);
    elements.push(place(piece, x - back, groundY - piece.height - lift));
    return { kind: "figure", type: piece.type };
  };

  while (x < canvasWidth * STREET_SPAN) {
    const roll = Math.random();

    if (landmarks && roll < landmarks.chance && fillersSinceLandmark >= MIN_FILLERS_BETWEEN_LANDMARKS) {
      const options = landmarks.ids.filter((id) => id !== lastLandmark);
      const id = options[Math.floor(Math.random() * options.length)];
      const piece = landmarks.make(id, palette);
      x += landmarks.padBefore;
      elements.push(place(piece, x, groundY - piece.height - BUILDING_INSET));
      x += piece.width + landmarks.padAfter;
      lastLandmark = id;
      fillersSinceLandmark = 0;
      last = figureAfter("landmark", landmarks.padAfter) ?? { kind: "landmark", type: piece.type };
    } else if (roll < fillers.chance || (trees.neverTwice && last?.kind === "tree")) {
      const { gap, ...piece } = fillers.make(palette);
      elements.push(place(piece, x, groundY - piece.height - BUILDING_INSET));
      x += piece.width + gap;
      fillersSinceLandmark++;
      last = figureAfter("filler", gap) ?? { kind: "filler", type: piece.type };
    } else {
      const { gap, lift, ...piece } = trees.make(palette, Math.random() * VERGE_DEPTH);
      elements.push(place(piece, x, groundY - piece.height - lift));
      x += piece.width + gap;
      last = { kind: "tree", type: piece.type };
    }
  }
  return elements;
}
