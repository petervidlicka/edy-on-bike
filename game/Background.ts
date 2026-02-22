import { BackgroundLayer, BackgroundElement } from "./types";
import type { EnvironmentDefinition, EnvironmentPalette } from "./environments/types";

function generateClouds(
  canvasWidth: number,
  groundY: number,
  palette: EnvironmentPalette,
  count: number
): BackgroundElement[] {
  const clouds: BackgroundElement[] = [];
  const spacing = canvasWidth / 5;
  for (let i = 0; i < count; i++) {
    clouds.push({
      type: "cloud",
      x: i * spacing,
      y: groundY * 0.08 + Math.random() * groundY * 0.25,
      width: 60 + Math.random() * 50,
      height: 20 + Math.random() * 15,
      color: palette.cloud,
    });
  }
  return clouds;
}

export function createBackgroundLayers(
  canvasWidth: number,
  groundY: number,
  envDef: EnvironmentDefinition
): BackgroundLayer[] {
  const bg = envDef.background;
  return [
    {
      elements: generateClouds(canvasWidth, groundY, envDef.palette, bg.cloudCount),
      speedRatio: bg.cloudSpeedRatio,
      offset: 0,
    },
    {
      elements: bg.generateElements(canvasWidth, groundY, envDef.palette),
      speedRatio: bg.buildingSpeedRatio,
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
