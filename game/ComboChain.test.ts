import { describe, expect, it } from "vitest";
import { addLink, createChain, endChain, formatMultiplier, multiplierForLinks, tickChain } from "./ComboChain";
import { COMBO_MAX_MULTIPLIER, COMBO_WINDOW_MS } from "./constants";

describe("multiplierForLinks", () => {
  it("starts at x1 and climbs half a step per extra link", () => {
    expect(multiplierForLinks(0)).toBe(1);
    expect(multiplierForLinks(1)).toBe(1);
    expect(multiplierForLinks(2)).toBe(1.5);
    expect(multiplierForLinks(3)).toBe(2);
  });

  it("caps at the max multiplier", () => {
    expect(multiplierForLinks(100)).toBe(COMBO_MAX_MULTIPLIER);
  });
});

describe("addLink", () => {
  it("pays the first trick at x1 and later ones with the climbing multiplier", () => {
    const chain = createChain();
    expect(addLink(chain, 100)).toEqual({ multiplier: 1, paid: 100 });
    expect(addLink(chain, 100)).toEqual({ multiplier: 1.5, paid: 150 });
    expect(chain.chainPoints).toBe(250);
    expect(chain.windowMs).toBe(COMBO_WINDOW_MS);
  });

  it("rounds paid points", () => {
    const chain = createChain();
    addLink(chain, 1);
    expect(addLink(chain, 33).paid).toBe(50); // 33 × 1.5 = 49.5
  });
});

describe("tickChain", () => {
  it("only drains while grounded and reports when the window runs out", () => {
    const chain = createChain();
    addLink(chain, 50);
    expect(tickChain(chain, COMBO_WINDOW_MS, false)).toBe(false); // airborne: holds
    expect(chain.windowMs).toBe(COMBO_WINDOW_MS);
    expect(tickChain(chain, COMBO_WINDOW_MS - 1, true)).toBe(false);
    expect(tickChain(chain, 5, true)).toBe(true);
  });

  it("does nothing without a running chain", () => {
    expect(tickChain(createChain(), 10_000, true)).toBe(false);
  });
});

describe("endChain", () => {
  it("returns the summary and resets to idle", () => {
    const chain = createChain();
    addLink(chain, 100);
    addLink(chain, 100);
    expect(endChain(chain)).toEqual({ links: 2, multiplier: 1.5, total: 250 });
    expect(chain).toEqual(createChain());
    expect(endChain(chain)).toBeNull();
  });
});

describe("formatMultiplier", () => {
  it("drops a needless decimal", () => {
    expect(formatMultiplier(2)).toBe("2");
    expect(formatMultiplier(2.5)).toBe("2.5");
  });
});
