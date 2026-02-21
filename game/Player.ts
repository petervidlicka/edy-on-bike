import { PlayerState } from "./types";
import { PLAYER_X_RATIO, PLAYER_WIDTH, PLAYER_HEIGHT, GRAVITY, JUMP_FORCE } from "./constants";

export function createPlayer(groundY: number, canvasWidth: number): PlayerState {
  return {
    x: Math.floor(canvasWidth * PLAYER_X_RATIO),
    y: groundY - PLAYER_HEIGHT,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velocityY: 0,
    jumpCount: 0,
    isOnGround: true,
    wheelRotation: 0,
  };
}

export function jumpPlayer(player: PlayerState): void {
  if (player.jumpCount >= 2) return;
  const force = player.jumpCount === 0 ? JUMP_FORCE : JUMP_FORCE * 0.85;
  player.velocityY = force;
  player.isOnGround = false;
  player.jumpCount++;
}

export function updatePlayer(
  player: PlayerState,
  dt: number,
  groundY: number,
  speed: number
): void {
  if (!player.isOnGround) {
    player.velocityY += GRAVITY * dt;
    player.y += player.velocityY * dt;

    const groundPos = groundY - player.height;
    if (player.y >= groundPos) {
      player.y = groundPos;
      player.velocityY = 0;
      player.isOnGround = true;
      player.jumpCount = 0;
    }
  }

  // Wheel rotation synced to game speed
  player.wheelRotation += speed * dt * 0.08;
}
