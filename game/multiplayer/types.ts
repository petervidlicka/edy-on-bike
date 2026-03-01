import type { TrickType } from "../types";

// ── Ghost snapshot — minimal state sent at ~15 Hz per player ──

export interface GhostSnapshot {
  /** Timestamp ms (monotonic client clock) */
  t: number;
  /** Height above ground (player.y) */
  y: number;
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
  /** Player is alive */
  a: boolean;
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
  | { type: "join"; name: string; skinId: string }
  | { type: "ready" }
  | { type: "player_update"; snapshot: GhostSnapshot }
  | { type: "player_crashed"; score: number }
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
  | { type: "error"; message: string };
