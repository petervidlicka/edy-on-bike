import { SkinDefinition, SkinId } from "./types";

export const SKINS: SkinDefinition[] = [
  {
    id: "default",
    name: "Edy Classic",
    helmetStyle: "standard",
    bikeStyle: "bmx",
    unlockScore: 0,
    colors: {
      wheel: "#2e2e2e",
      frame: "#8b1a1a",
      helmet: "#9b3333",
      skin: "#c8a882",
      shirt: "#7a8a9a",
      pants: "#5a5a6a",
    },
  },
  {
    id: "racer",
    name: "Road Racer",
    helmetStyle: "aero",
    bikeStyle: "racing",
    unlockScore: 300,
    colors: {
      wheel: "#3a3a3a",
      frame: "#cc3333",
      helmet: "#eeeeee",
      skin: "#c8a882",
      shirt: "#cc3333",
      pants: "#2a2a2a",
    },
  },
  {
    id: "cowboy",
    name: "Trail Rider",
    helmetStyle: "standard",
    bikeStyle: "mtb",
    unlockScore: 400,
    colors: {
      wheel: "#3a3a3a",
      frame: "#d4722a",
      helmet: "#f5f0e8",
      skin: "#c8a882",
      shirt: "#6a8a5a",
      pants: "#5a4a3a",
    },
  },
  {
    id: "royal",
    name: "Royal Rider",
    helmetStyle: "crown",
    bikeStyle: "cruiser",
    unlockScore: 550,
    colors: {
      wheel: "#4a4a48",
      frame: "#6a5aaa",
      helmet: "#daa520",
      skin: "#c8a882",
      shirt: "#6a3a8a",
      pants: "#3a2a5a",
    },
  },
  {
    id: "neon",
    name: "Neon Night",
    helmetStyle: "cap",
    bikeStyle: "fixie",
    unlockScore: 750,
    colors: {
      wheel: "#ff8800",
      frame: "#00ccff",
      helmet: "#ff00ff",
      skin: "#c8a882",
      shirt: "#00ff88",
      pants: "#222222",
    },
  },
  {
    id: "stealth",
    name: "Shadow Ops",
    helmetStyle: "goggles",
    bikeStyle: "fatTire",
    unlockScore: 1050,
    colors: {
      wheel: "#2a2a2a",
      frame: "#3a3a3a",
      helmet: "#2a2a2a",
      skin: "#8a7a6a",
      shirt: "#3a3a3a",
      pants: "#2a2a2a",
    },
  },
];

export function getSkinById(id: SkinId): SkinDefinition {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}

export function isSkinUnlocked(
  skin: SkinDefinition,
  bestScore: number,
  cheatUnlocked: boolean
): boolean {
  return cheatUnlocked || bestScore >= skin.unlockScore;
}
