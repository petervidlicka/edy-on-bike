import { describe, expect, it } from "vitest";
import { checkCollision, checkRampCollision, checkRideableCollision } from "./Collision";
import { createPlayer } from "./Player";
import { ObstacleType, type ObstacleInstance } from "./types";

const GROUND = 500;

function obstacle(overrides: Partial<ObstacleInstance>): ObstacleInstance {
  return { type: ObstacleType.ROCK, x: 0, y: GROUND - 40, width: 60, height: 40, rideable: false, ramp: false, ...overrides };
}

function playerAt(x: number, bottom: number) {
  const player = createPlayer(GROUND, 1000);
  player.x = x;
  player.y = bottom - player.height;
  return player;
}

describe("checkCollision", () => {
  it("hits on overlap and forgives a near miss inside the padding", () => {
    const rock = obstacle({ x: 100 });
    const player = playerAt(0, GROUND);
    player.x = 100 - player.width + 20; // 20px overlap: past the 8+8 padding
    expect(checkCollision(player, rock)).toBe(true);
    player.x = 100 - player.width + 10; // 10px: within padding
    expect(checkCollision(player, rock)).toBe(false);
  });
});

describe("checkRideableCollision", () => {
  const container = obstacle({ type: ObstacleType.SHIPPING_CONTAINER, x: 100, y: GROUND - 60, height: 60, width: 200, rideable: true });

  it("lands on top when falling onto it", () => {
    const player = playerAt(150, container.y + 10);
    player.velocityY = 5;
    expect(checkRideableCollision(player, container)).toBe("land_on_top");
  });

  it("crashes into the side", () => {
    const player = playerAt(60, GROUND);
    player.velocityY = 0;
    expect(checkRideableCollision(player, container)).toBe("crash");
  });

  it("still lands when a slow frame carried the rider deep past the top (swept from prevY)", () => {
    const player = playerAt(150, container.y + 45); // beyond the 35px tolerance
    player.velocityY = 15;
    const prevY = container.y - 5 - player.height; // was above the top last frame
    expect(checkRideableCollision(player, container)).toBe("crash");
    expect(checkRideableCollision(player, container, prevY)).toBe("land_on_top");
  });

  it("reports no contact when apart", () => {
    expect(checkRideableCollision(playerAt(500, GROUND), container)).toBe("none");
  });
});

describe("checkRampCollision", () => {
  it("follows a straight ramp's surface", () => {
    const ramp = obstacle({ type: ObstacleType.STRAIGHT_RAMP, x: 100, width: 100, height: 40, ramp: true });
    const player = playerAt(0, GROUND);
    player.x = 150 - player.width / 2; // centre halfway up
    const result = checkRampCollision(player, ramp);
    expect(result).toMatchObject({ onRamp: true, rampType: "straight", surfaceY: GROUND - 20 });
  });

  it("ignores non-ramps", () => {
    expect(checkRampCollision(playerAt(0, GROUND), obstacle({})).onRamp).toBe(false);
  });
});
