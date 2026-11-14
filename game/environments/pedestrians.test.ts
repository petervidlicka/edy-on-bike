import { describe, expect, it } from "vitest";
import { decodePedestrianVariant, PEDESTRIAN_KINDS, pickPedestrian, SKIN_TONES } from "./pedestrians";

/** An rng that hands out the given values in order. */
function sequence(values: number[]): () => number {
  let i = 0;
  return () => values[i++];
}

describe("pedestrian variants", () => {
  it("round-trip every kind and skin tone through the packed variant", () => {
    PEDESTRIAN_KINDS.forEach((kind, kindIndex) => {
      SKIN_TONES.forEach((_, skinIndex) => {
        const variant = kindIndex + PEDESTRIAN_KINDS.length * skinIndex;
        expect(decodePedestrianVariant(variant)).toEqual({ kind, skinIndex });
      });
    });
  });

  it("packs the picked kind and tone so the renderer decodes the same person", () => {
    const woman = pickPedestrian(sequence([0.5, 0.75, 0, 0]));
    expect(decodePedestrianVariant(woman.variant!)).toEqual({ kind: "woman", skinIndex: 3 });
    expect(woman).toMatchObject({ width: 14, height: 32 });
    expect(woman.color).toMatch(/^#[0-9a-f]{6}$/);
    expect(woman.roofColor).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("makes children shorter", () => {
    const child = pickPedestrian(sequence([0.9, 0, 0, 0]));
    expect(decodePedestrianVariant(child.variant!).kind).toBe("child");
    expect(child).toMatchObject({ width: 11, height: 22 });
  });
});
