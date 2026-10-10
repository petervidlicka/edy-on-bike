import type { TrickType } from "../types";

// ── Ghost snapshot — minimal state sent at ~15 Hz per player ──

export interface GhostSnapshot {
  /**
   * Sender's performance.now() in ms. Each page has its own time origin, so receivers
   * must map this onto their clock (see InterpolationBuffer) rather than compare directly.
   */
  t: number;
  /**
   * Height of the rider's top edge above the ground line (groundY − player.y).
   * Relative so it renders correctly on viewports with a different groundY.
   */
  h: number;
  /** Is on ground */
  og: boolean;
  /** Wheel rotation */
  wr: number;
  /** Bike tilt */
  bt: number;
  /** Rider lean */
  rl: number;
  /** Rider crouch */
  rc: number;
  /** Leg tuck */
  lt: number;
  /** Backflip angle */
  ba: number;
  /** Flip direction (1 = backflip, -1 = frontflip) */
  fd: number;
  /** Active trick enum */
  at: TrickType;
  /** Trick progress 0-1 */
  tp: number;
  /** Current score */
  s: number;
}

// ── Room phases ──

export type RoomPhase = "lobby" | "countdown" | "racing" | "finished";

// ── Player info (lobby state) ──

export interface PlayerInfo {
  id: string;
  name: string;
  skinId: string;
  ready: boolean;
  alive: boolean;
  score: number;
}

// ── Ranking entry (end of race) ──

export interface RankingEntry {
  playerId: string;
  name: string;
  skinId: string;
  score: number;
  rank: number;
}

// ── Client → Server messages ──

export type ClientMessage =
  /** `intent` lets the server reject joins to codes nobody is in, instead of silently creating a room. */
  | { type: "join"; name: string; skinId: string; intent: "create" | "join" }
  | { type: "ready" }
  | { type: "player_update"; snapshot: GhostSnapshot }
  | { type: "player_crashed"; score: number }
  /** "Play Again" from the results screen — keeps the group in the same room. */
  | { type: "rematch" }
  | { type: "leave" };

// ── Server → Client messages ──

export type ServerMessage =
  | {
      type: "room_joined";
      roomCode: string;
      playerId: string;
      players: PlayerInfo[];
      phase: RoomPhase;
      seed: number;
    }
  | { type: "player_joined"; player: PlayerInfo }
  | { type: "player_left"; playerId: string }
  | { type: "player_ready"; playerId: string }
  | {
      type: "countdown_start";
      startAtMs: number;
      seed: number;
    }
  | { type: "race_start" }
  | {
      type: "ghost_update";
      playerId: string;
      snapshot: GhostSnapshot;
    }
  | {
      type: "player_crashed";
      playerId: string;
      score: number;
    }
  | {
      type: "race_finished";
      rankings: RankingEntry[];
    }
  /** Room went back to the lobby for a rematch; everyone is un-ready with scores cleared. */
  | { type: "room_reset"; players: PlayerInfo[] }
  | { type: "error"; message: string };
