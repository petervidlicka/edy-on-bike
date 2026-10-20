import { ObstacleInstance, ObstacleType } from "../../types";
import type { EnvironmentPalette } from "../../environments/types";

import {
  drawRock, drawSmallTree, drawTallTree, drawGiantTree,
  drawStraightRamp, drawCurvedRamp, drawShoppingTrolley,
  drawCar, drawSuv, drawDeliveryVan, drawPersonOnBike, drawBusStop,
  drawShippingContainer, drawContainerWithRamp,
} from "./suburbanObstacles";

import {
  drawCamel, drawSandTrap, drawLandCruiser, drawPinkGClass,
  drawCactus, drawDubaiChocolate, drawDubaiBillboard, drawLamborghiniHuracan, drawFerrari458, drawConvertible, drawRollsRoycePhantom, drawPorsche911,
} from "./dubaiObstacles";

import {
  drawSnowman, drawFrozenLake, drawRedDeer, drawBeerCrates, drawBeerCrateWall,
  drawSnowCat, drawSnowKicker, drawFreerideSkier, drawRaceSkier, drawSnowboarder, drawSnowScooter,
} from "./austriaObstacles";

import {
  drawKeiCar, drawKeiTruck, drawJapanTaxi, drawSamurai, drawSushiRolls, drawVendingMachine, drawSakeBarrels,
  drawDeliveryScooter, drawUmbrellaCyclist, drawKawaiiBarrier, drawManekiNeko, drawRamenBowl, drawShibaInu,
} from "./tokyoObstacles";

/**
 * Motor vehicles are oncoming traffic. Their art is authored facing right, but the world
 * scrolls left, so drawn as-is they read as reversing towards the rider — mirror them.
 */
const ONCOMING_VEHICLES: ReadonlySet<ObstacleType> = new Set([
  ObstacleType.CAR, ObstacleType.SUV, ObstacleType.DELIVERY_VAN,
  ObstacleType.LAND_CRUISER, ObstacleType.PINK_G_CLASS, ObstacleType.LAMBORGHINI_HURACAN,
  ObstacleType.FERRARI_458, ObstacleType.CONVERTIBLE, ObstacleType.ROLLS_ROYCE_PHANTOM,
  ObstacleType.PORSCHE_911, ObstacleType.KEI_CAR, ObstacleType.KEI_TRUCK, ObstacleType.JAPAN_TAXI,
]);

export function drawObstacle(ctx: CanvasRenderingContext2D, obstacle: ObstacleInstance, palette: EnvironmentPalette) {
  if (!ONCOMING_VEHICLES.has(obstacle.type)) {
    drawObstacleArt(ctx, obstacle, palette);
    return;
  }
  ctx.save();
  ctx.translate(2 * obstacle.x + obstacle.width, 0);
  ctx.scale(-1, 1);
  drawObstacleArt(ctx, obstacle, palette);
  ctx.restore();
}

function drawObstacleArt(ctx: CanvasRenderingContext2D, obstacle: ObstacleInstance, palette: EnvironmentPalette) {
  const { type, x, y, width: w, height: h } = obstacle;
  switch (type) {
    case ObstacleType.ROCK:               drawRock(ctx, x, y, w, h, palette); break;
    case ObstacleType.SMALL_TREE:         drawSmallTree(ctx, x, y, w, h, palette); break;
    case ObstacleType.TALL_TREE:          drawTallTree(ctx, x, y, w, h, palette); break;
    case ObstacleType.SHOPPING_TROLLEY:   drawShoppingTrolley(ctx, x, y, w, h, palette); break;
    case ObstacleType.CAR:                drawCar(ctx, x, y, w, h, palette); break;
    case ObstacleType.SUV:                drawSuv(ctx, x, y, w, h, palette); break;
    case ObstacleType.DELIVERY_VAN:       drawDeliveryVan(ctx, x, y, w, h, palette); break;
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
    case ObstacleType.FERRARI_458:        drawFerrari458(ctx, x, y, w, h, palette); break;
    case ObstacleType.CONVERTIBLE:        drawConvertible(ctx, x, y, w, h, palette); break;
    case ObstacleType.ROLLS_ROYCE_PHANTOM: drawRollsRoycePhantom(ctx, x, y, w, h, palette); break;
    case ObstacleType.PORSCHE_911:        drawPorsche911(ctx, x, y, w, h, palette); break;
    case ObstacleType.DUBAI_BILLBOARD:    drawDubaiBillboard(ctx, x, y, w, h, palette); break;
    case ObstacleType.SNOWMAN:            drawSnowman(ctx, x, y, w, h, palette); break;
    case ObstacleType.FROZEN_LAKE:        drawFrozenLake(ctx, x, y, w, h, palette); break;
    case ObstacleType.RED_DEER:           drawRedDeer(ctx, x, y, w, h, palette); break;
    case ObstacleType.BEER_CRATES:        drawBeerCrates(ctx, x, y, w, h, palette); break;
    case ObstacleType.BEER_CRATE_WALL:    drawBeerCrateWall(ctx, x, y, w, h, palette); break;
    case ObstacleType.SNOW_CAT:           drawSnowCat(ctx, x, y, w, h, palette); break;
    case ObstacleType.SNOW_KICKER:        drawSnowKicker(ctx, x, y, w, h, palette); break;
    case ObstacleType.FREERIDE_SKIER:     drawFreerideSkier(ctx, x, y, w, h); break;
    case ObstacleType.RACE_SKIER:         drawRaceSkier(ctx, x, y, w, h, palette); break;
    case ObstacleType.SNOWBOARDER:        drawSnowboarder(ctx, x, y, w, h); break;
    case ObstacleType.SNOW_SCOOTER:       drawSnowScooter(ctx, x, y, w, h); break;
    case ObstacleType.KEI_CAR:            drawKeiCar(ctx, x, y, w, h, palette); break;
    case ObstacleType.KEI_TRUCK:          drawKeiTruck(ctx, x, y, w, h, palette); break;
    case ObstacleType.JAPAN_TAXI:         drawJapanTaxi(ctx, x, y, w, h, palette); break;
    case ObstacleType.SAMURAI:            drawSamurai(ctx, x, y, w, h); break;
    case ObstacleType.SUSHI_ROLLS:        drawSushiRolls(ctx, x, y, w, h); break;
    case ObstacleType.VENDING_MACHINE:    drawVendingMachine(ctx, x, y, w, h); break;
    case ObstacleType.SAKE_BARRELS:       drawSakeBarrels(ctx, x, y, w, h); break;
    case ObstacleType.DELIVERY_SCOOTER:   drawDeliveryScooter(ctx, x, y, w, h); break;
    case ObstacleType.UMBRELLA_CYCLIST:   drawUmbrellaCyclist(ctx, x, y, w, h); break;
    case ObstacleType.KAWAII_BARRIER:     drawKawaiiBarrier(ctx, x, y, w, h); break;
    case ObstacleType.MANEKI_NEKO:        drawManekiNeko(ctx, x, y, w, h); break;
    case ObstacleType.RAMEN_BOWL:         drawRamenBowl(ctx, x, y, w, h); break;
    case ObstacleType.SHIBA_INU:          drawShibaInu(ctx, x, y, w, h, palette); break;
  }
}
