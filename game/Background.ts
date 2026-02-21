import { BackgroundLayer, BackgroundElement } from "./types";
import { COLORS } from "./constants";

function generateClouds(canvasWidth: number, groundY: number): BackgroundElement[] {
  const clouds: BackgroundElement[] = [];
  const spacing = canvasWidth / 5;
  for (let i = 0; i < 12; i++) {
    clouds.push({
      type: "cloud",
      x: i * spacing,
      y: groundY * 0.08 + Math.random() * groundY * 0.25,
      width: 60 + Math.random() * 50,
      height: 20 + Math.random() * 15,
      color: COLORS.cloud,
    });
  }
  return clouds;
}

function generateHousesAndTrees(canvasWidth: number, groundY: number): BackgroundElement[] {
  const elements: BackgroundElement[] = [];
  const houseColors = [
    { wall: COLORS.house1, roof: COLORS.roof1 },
    { wall: COLORS.house2, roof: COLORS.roof2 },
    { wall: COLORS.house3, roof: COLORS.roof3 },
    { wall: COLORS.house4, roof: COLORS.roof4 },
  ];

  let x = 0;
  let lastType = "";

  while (x < canvasWidth * 2.5) {
    const roll = Math.random();

    if (roll > 0.35) {
      // House (65% chance)
      const variant = Math.floor(Math.random() * 3); // 0 = cottage, 1 = village, 2 = tall
      const w = variant === 2 ? 40 + Math.random() * 15 : 50 + Math.random() * 30;
      const h = variant === 2 ? 55 + Math.random() * 20 : 40 + Math.random() * 20;
      const scheme = houseColors[Math.floor(Math.random() * houseColors.length)];
      elements.push({
        type: "house",
        x,
        y: groundY - h - 20,
        width: w,
        height: h,
        color: scheme.wall,
        roofColor: scheme.roof,
        variant,
      });
      const gap = 20 + Math.random() * 30;
      x += w + gap;

      // Maybe add a deer or person in the gap
      if (gap > 25 && Math.random() > 0.6 && lastType !== "deer" && lastType !== "walking_person") {
        const isAnimal = Math.random() > 0.45;
        if (isAnimal) {
          elements.push({
            type: "deer",
            x: x - gap * 0.6,
            y: groundY - 32 - Math.random() * 5,
            width: 30,
            height: 28,
            color: COLORS.deer,
          });
          lastType = "deer";
        } else {
          elements.push({
            type: "walking_person",
            x: x - gap * 0.5,
            y: groundY - 38 - Math.random() * 3,
            width: 14,
            height: 32,
            color: COLORS.person,
          });
          lastType = "walking_person";
        }
      } else {
        lastType = "house";
      }
    } else {
      // Tree (35% chance)
      elements.push({
        type: "tree_silhouette",
        x,
        y: groundY - 65 - Math.random() * 15,
        width: 22 + Math.random() * 12,
        height: 55 + Math.random() * 20,
        color: COLORS.treeSilhouette,
      });
      x += 35 + Math.random() * 25;
      lastType = "tree";
    }
  }
  return elements;
}

export function createBackgroundLayers(canvasWidth: number, groundY: number): BackgroundLayer[] {
  return [
    {
      elements: generateClouds(canvasWidth, groundY),
      speedRatio: 0.1,
      offset: 0,
    },
    {
      elements: generateHousesAndTrees(canvasWidth, groundY),
      speedRatio: 0.4,
      offset: 0,
    },
    {
      elements: [],
      speedRatio: 0.6,
      offset: 0,
    },
  ];
}

export function getTotalLayerWidth(layer: BackgroundLayer, canvasWidth: number): number {
  if (layer.elements.length === 0) return canvasWidth;
  const last = layer.elements[layer.elements.length - 1];
  return last.x + last.width;
}

export function updateLayers(layers: BackgroundLayer[], speed: number, dt: number): void {
  for (const layer of layers) {
    layer.offset += speed * layer.speedRatio * dt;
  }
}
