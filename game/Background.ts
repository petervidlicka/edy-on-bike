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
  ];

  let x = 0;
  while (x < canvasWidth * 2.5) {
    if (Math.random() > 0.4) {
      const w = 50 + Math.random() * 30;
      const h = 40 + Math.random() * 20;
      const scheme = houseColors[Math.floor(Math.random() * houseColors.length)];
      elements.push({
        type: "house",
        x,
        y: groundY - h - 20,
        width: w,
        height: h,
        color: scheme.wall,
        roofColor: scheme.roof,
      });
      x += w + 20 + Math.random() * 40;
    } else {
      elements.push({
        type: "tree_silhouette",
        x,
        y: groundY - 60 - Math.random() * 20,
        width: 25 + Math.random() * 15,
        height: 50 + Math.random() * 20,
        color: COLORS.treeSilhouette,
      });
      x += 40 + Math.random() * 30;
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
