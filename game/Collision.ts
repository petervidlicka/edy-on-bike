import { PlayerState, ObstacleInstance } from "./types";

// Inner padding makes hitboxes slightly smaller than the visual bounds,
// so near-misses feel fair rather than frustrating.
const HITBOX_PADDING = 8;

export function checkCollision(player: PlayerState, obstacle: ObstacleInstance): boolean {
  return (
    player.x + HITBOX_PADDING < obstacle.x + obstacle.width - HITBOX_PADDING &&
    player.x + player.width - HITBOX_PADDING > obstacle.x + HITBOX_PADDING &&
    player.y + HITBOX_PADDING < obstacle.y + obstacle.height - HITBOX_PADDING &&
    player.y + player.height - HITBOX_PADDING > obstacle.y + HITBOX_PADDING
  );
}
