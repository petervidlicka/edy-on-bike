import { ObstacleInstance, ObstacleType } from "../../types";
import type { EnvironmentPalette } from "../../environments/types";

import {
  drawRock, drawSmallTree, drawTallTree, drawGiantTree,
  drawStraightRamp, drawCurvedRamp, drawShoppingTrolley,
  drawCar, drawPersonOnBike, drawBusStop,
  drawShippingContainer, drawContainerWithRamp,
} from "./suburbanObstacles";

import {
  drawCamel, drawSandTrap, drawLandCruiser, drawPinkGClass,
  drawCactus, drawDubaiChocolate, drawDubaiBillboard, drawLamborghiniHuracan,
} from "./dubaiObstacles";

export function drawObstacle(ctx: CanvasRenderingContext2D, obstacle: ObstacleInstance, palette: EnvironmentPalette) {
  const { type, x, y, width: w, height: h } = obstacle;
  switch (type) {
    case ObstacleType.ROCK:               drawRock(ctx, x, y, w, h, palette); break;
    case ObstacleType.SMALL_TREE:         drawSmallTree(ctx, x, y, w, h, palette); break;
    case ObstacleType.TALL_TREE:          drawTallTree(ctx, x, y, w, h, palette); break;
    case ObstacleType.SHOPPING_TROLLEY:   drawShoppingTrolley(ctx, x, y, w, h, palette); break;
    case ObstacleType.CAR:                drawCar(ctx, x, y, w, h, palette); break;
    case ObstacleType.PERSON_ON_BIKE:     drawPersonOnBike(ctx, x, y, w, h, palette); break;
    case ObstacleType.BUS_STOP:           drawBusStop(ctx, x, y, w, h, palette); break;
    case ObstacleType.SHIPPING_CONTAINER: drawShippingContainer(ctx, x, y, w, h, palette); break;
    case ObstacleType.GIANT_TREE:         drawGiantTree(ctx, x, y, w, h, palette); break;
    case ObstacleType.STRAIGHT_RAMP:      drawStraightRamp(ctx, x, y, w, h, palette); break;
    case ObstacleType.CURVED_RAMP:        drawCurvedRamp(ctx, x, y, w, h, palette); break;
    case ObstacleType.CONTAINER_WITH_RAMP: drawContainerWithRamp(ctx, x, y, w, h, palette); break;
    case ObstacleType.CAMEL:              drawCamel(ctx, x, y, w, h, palette); break;
    case ObstacleType.SAND_TRAP:          drawSandTrap(ctx, x, y, w, h, palette); break;
    case ObstacleType.LAND_CRUISER:       drawLandCruiser(ctx, x, y, w, h, palette); break;
    case ObstacleType.PINK_G_CLASS:       drawPinkGClass(ctx, x, y, w, h, palette); break;
    case ObstacleType.CACTUS:             drawCactus(ctx, x, y, w, h, palette); break;
    case ObstacleType.DUBAI_CHOCOLATE:    drawDubaiChocolate(ctx, x, y, w, h, palette); break;
    case ObstacleType.LAMBORGHINI_HURACAN: drawLamborghiniHuracan(ctx, x, y, w, h, palette); break;
    case ObstacleType.DUBAI_BILLBOARD:    drawDubaiBillboard(ctx, x, y, w, h, palette); break;
  }
}
