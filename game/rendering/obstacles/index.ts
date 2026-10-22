/**
 * Obstacle draw dispatch: one entry per ObstacleType, so the Record type guarantees every
 * obstacle has a renderer. Oncoming vehicles are mirrored here, once, rather than in
 * each vehicle's art.
 */
import { ObstacleInstance, ObstacleType } from "../../types";
import type { EnvironmentPalette } from "../../environments/types";
import { setSceneTimeMs } from "../sceneClock";

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
 * Draws an obstacle into its spec box (x, y, w, h), standing on the box's bottom edge.
 * The palette is always passed; renderers with fixed colours simply don't declare it.
 */
export type ObstacleDrawFn = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  palette: EnvironmentPalette,
) => void;

/** Renderer per obstacle type. A missing entry is a type error, so no obstacle can draw as nothing. */
const OBSTACLE_DRAWERS: Record<ObstacleType, ObstacleDrawFn> = {
  // Suburban
  [ObstacleType.ROCK]: drawRock,
  [ObstacleType.SMALL_TREE]: drawSmallTree,
  [ObstacleType.TALL_TREE]: drawTallTree,
  [ObstacleType.GIANT_TREE]: drawGiantTree,
  [ObstacleType.SHOPPING_TROLLEY]: drawShoppingTrolley,
  [ObstacleType.CAR]: drawCar,
  [ObstacleType.SUV]: drawSuv,
  [ObstacleType.DELIVERY_VAN]: drawDeliveryVan,
  [ObstacleType.PERSON_ON_BIKE]: drawPersonOnBike,
  [ObstacleType.BUS_STOP]: drawBusStop,
  [ObstacleType.SHIPPING_CONTAINER]: drawShippingContainer,
  [ObstacleType.STRAIGHT_RAMP]: drawStraightRamp,
  [ObstacleType.CURVED_RAMP]: drawCurvedRamp,
  [ObstacleType.CONTAINER_WITH_RAMP]: drawContainerWithRamp,
  // Dubai
  [ObstacleType.CAMEL]: drawCamel,
  [ObstacleType.SAND_TRAP]: drawSandTrap,
  [ObstacleType.LAND_CRUISER]: drawLandCruiser,
  [ObstacleType.PINK_G_CLASS]: drawPinkGClass,
  [ObstacleType.CACTUS]: drawCactus,
  [ObstacleType.DUBAI_CHOCOLATE]: drawDubaiChocolate,
  [ObstacleType.LAMBORGHINI_HURACAN]: drawLamborghiniHuracan,
  [ObstacleType.FERRARI_458]: drawFerrari458,
  [ObstacleType.CONVERTIBLE]: drawConvertible,
  [ObstacleType.ROLLS_ROYCE_PHANTOM]: drawRollsRoycePhantom,
  [ObstacleType.PORSCHE_911]: drawPorsche911,
  [ObstacleType.DUBAI_BILLBOARD]: drawDubaiBillboard,
  // Austria
  [ObstacleType.SNOWMAN]: drawSnowman,
  [ObstacleType.FROZEN_LAKE]: drawFrozenLake,
  [ObstacleType.RED_DEER]: drawRedDeer,
  [ObstacleType.BEER_CRATES]: drawBeerCrates,
  [ObstacleType.BEER_CRATE_WALL]: drawBeerCrateWall,
  [ObstacleType.SNOW_CAT]: drawSnowCat,
  [ObstacleType.SNOW_KICKER]: drawSnowKicker,
  [ObstacleType.FREERIDE_SKIER]: drawFreerideSkier,
  [ObstacleType.RACE_SKIER]: drawRaceSkier,
  [ObstacleType.SNOWBOARDER]: drawSnowboarder,
  [ObstacleType.SNOW_SCOOTER]: drawSnowScooter,
  // Tokyo
  [ObstacleType.KEI_CAR]: drawKeiCar,
  [ObstacleType.KEI_TRUCK]: drawKeiTruck,
  [ObstacleType.JAPAN_TAXI]: drawJapanTaxi,
  [ObstacleType.SAMURAI]: drawSamurai,
  [ObstacleType.SUSHI_ROLLS]: drawSushiRolls,
  [ObstacleType.VENDING_MACHINE]: drawVendingMachine,
  [ObstacleType.SAKE_BARRELS]: drawSakeBarrels,
  [ObstacleType.DELIVERY_SCOOTER]: drawDeliveryScooter,
  [ObstacleType.UMBRELLA_CYCLIST]: drawUmbrellaCyclist,
  [ObstacleType.KAWAII_BARRIER]: drawKawaiiBarrier,
  [ObstacleType.MANEKI_NEKO]: drawManekiNeko,
  [ObstacleType.RAMEN_BOWL]: drawRamenBowl,
  [ObstacleType.SHIBA_INU]: drawShibaInu,
};

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

/**
 * Draws one obstacle at its world position, mirrored if it is oncoming traffic.
 * @param nowMs - Scene clock (engine time that stops while paused) for animated details
 *   such as blinking lamps and steam.
 */
export function drawObstacle(ctx: CanvasRenderingContext2D, obstacle: ObstacleInstance, palette: EnvironmentPalette, nowMs = 0) {
  setSceneTimeMs(nowMs);
  const draw = OBSTACLE_DRAWERS[obstacle.type];
  const { x, y, width: w, height: h } = obstacle;
  if (!ONCOMING_VEHICLES.has(obstacle.type)) {
    draw(ctx, x, y, w, h, palette);
    return;
  }
  ctx.save();
  ctx.translate(2 * x + w, 0);
  ctx.scale(-1, 1);
  draw(ctx, x, y, w, h, palette);
  ctx.restore();
}
