import { describe, expect, it } from "vitest";
import { BOOST_HOLD_MS, BOOST_MAX_X_RATIO, TrickBoost } from "./TrickBoost";
import { PLAYER_X_RATIO } from "../constants";

const MAX_OFFSET = BOOST_MAX_X_RATIO - PLAYER_X_RATIO;

/** Advances in frame-sized steps so the exponential ease behaves as it does in the game loop. */
function advance(boost: TrickBoost, ms: number, step = 16): void {
  for (let t = 0; t < ms; t += step) boost.update(Math.min(step, ms - t));
}

describe("TrickBoost", () => {
  it("surges toward a per-trick gain and sits there while the hold lasts", () => {
    const boost = new TrickBoost();
    boost.onTrick(0, false);
    boost.update(16);
    expect(boost.offset).toBeGreaterThan(0);
    expect(boost.offset).toBeLessThan(0.05); // easing: not there in one frame
    advance(boost, 2000);
    expect(boost.offset).toBeCloseTo(0.05, 3); // MIN_GAIN for a zero-point trick
  });

  it("pushes further for bigger tricks and half as far for sketchy landings", () => {
    const big = new TrickBoost();
    big.onTrick(300, false);
    advance(big, 2000);
    expect(big.offset).toBeCloseTo(0.14, 3); // MIN_GAIN + EXTRA_GAIN

    const sketchy = new TrickBoost();
    sketchy.onTrick(300, true);
    advance(sketchy, 2000);
    expect(sketchy.offset).toBeCloseTo(0.07, 3);
  });

  it("caps at BOOST_MAX_X_RATIO no matter how many tricks land", () => {
    const boost = new TrickBoost();
    for (let i = 0; i < 20; i++) boost.onTrick(300, false);
    advance(boost, 3000);
    expect(boost.offset).toBeCloseTo(MAX_OFFSET, 4);
    expect(PLAYER_X_RATIO + boost.offset).toBeLessThanOrEqual(BOOST_MAX_X_RATIO + 1e-9);
  });

  it("holds for BOOST_HOLD_MS after the last trick, then eases back home", () => {
    const boost = new TrickBoost();
    boost.onTrick(300, false);
    advance(boost, BOOST_HOLD_MS - 100);
    const held = boost.offset;
    expect(held).toBeCloseTo(0.14, 3);

    advance(boost, 200); // hold expires inside this window
    expect(boost.offset).toBeLessThan(held);
    expect(boost.offset).toBeGreaterThan(0); // the return is a drift, not a snap
    advance(boost, 6000);
    expect(boost.offset).toBe(0);
  });

  it("restarts the hold on every landed trick", () => {
    const boost = new TrickBoost();
    boost.onTrick(0, false);
    advance(boost, BOOST_HOLD_MS - 100);
    boost.onTrick(0, false);
    advance(boost, BOOST_HOLD_MS - 100);
    expect(boost.offset).toBeCloseTo(0.1, 3); // still boosted, and both gains count
  });

  it("reset clears the offset and the hold", () => {
    const boost = new TrickBoost();
    boost.onTrick(300, false);
    advance(boost, 500);
    boost.reset();
    expect(boost.offset).toBe(0);
    advance(boost, 500);
    expect(boost.offset).toBe(0);
  });
});
