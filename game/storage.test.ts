import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  activateCheat, DEFAULT_SKIN_STATE, loadPlayerName, loadSkinState, savePlayerName, saveSkinState, selectSkin, updateBestScore,
} from "./storage";

/** A Map-backed stand-in for window.localStorage; node has neither. */
function fakeStorage(): Storage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    get length() { return map.size; },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => { map.delete(key); },
    setItem: (key: string, value: string) => { map.set(key, value); },
  };
}

const KEY = "edy-skin-state";
let storage: ReturnType<typeof fakeStorage>;

beforeEach(() => {
  storage = fakeStorage();
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadSkinState", () => {
  it("gives a fresh copy of the default when nothing is stored", () => {
    const state = loadSkinState();
    expect(state).toEqual(DEFAULT_SKIN_STATE);
    expect(state).not.toBe(DEFAULT_SKIN_STATE);
  });

  it.each(["{nope", "42", "null", "\"racer\"", "[]"])("falls back to the default for corrupt JSON %s", (raw) => {
    storage.map.set(KEY, raw);
    expect(loadSkinState()).toEqual(DEFAULT_SKIN_STATE);
  });

  it("keeps the good fields of a partly corrupt record", () => {
    storage.map.set(KEY, JSON.stringify({ selectedSkinId: "racer", bestScore: "lots", cheatUnlocked: "yes" }));
    expect(loadSkinState()).toEqual({ selectedSkinId: "racer", bestScore: 0, cheatUnlocked: false });
    storage.map.set(KEY, JSON.stringify({ selectedSkinId: "not-a-skin", bestScore: -5, cheatUnlocked: true }));
    expect(loadSkinState()).toEqual({ selectedSkinId: "default", bestScore: 0, cheatUnlocked: true });
    storage.map.set(KEY, JSON.stringify({ bestScore: Infinity }));
    expect(loadSkinState().bestScore).toBe(0);
  });

  it("falls back to the default when storage throws", () => {
    storage.getItem = () => { throw new Error("blocked"); };
    expect(loadSkinState()).toEqual(DEFAULT_SKIN_STATE);
  });

  it("is the default on the server", () => {
    vi.unstubAllGlobals();
    expect(loadSkinState()).toEqual(DEFAULT_SKIN_STATE);
  });
});

describe("updates", () => {
  it("records only a higher best score", () => {
    expect(updateBestScore(120).bestScore).toBe(120);
    expect(updateBestScore(80).bestScore).toBe(120);
    expect(loadSkinState().bestScore).toBe(120);
  });

  it("remembers the chosen skin and the cheat", () => {
    expect(selectSkin("neon").selectedSkinId).toBe("neon");
    expect(activateCheat()).toEqual({ selectedSkinId: "neon", bestScore: 0, cheatUnlocked: true });
    expect(loadSkinState()).toEqual({ selectedSkinId: "neon", bestScore: 0, cheatUnlocked: true });
  });

  it("swallows a full or disabled store on write", () => {
    storage.setItem = () => { throw new Error("quota"); };
    expect(() => saveSkinState({ ...DEFAULT_SKIN_STATE })).not.toThrow();
    expect(() => savePlayerName("Edy")).not.toThrow();
  });
});

describe("player name", () => {
  it("round-trips and is empty when unset", () => {
    expect(loadPlayerName()).toBe("");
    savePlayerName("Edy");
    expect(loadPlayerName()).toBe("Edy");
  });
});
