/**
 * Client-side multiplayer state for one race: buffers remote snapshots, tracks
 * live scores and crash status, and throttles the local player's updates.
 */
import type { GhostSnapshot, PlayerInfo, ServerMessage, ClientMessage } from "./protocol";
import type { SkinId } from "../types";
import { InterpolationBuffer } from "./interpolation";
import { NETWORK_SYNC_INTERVAL_MS } from "../constants";

/** A remote player ready to draw this frame. */
export interface GhostPlayer {
  id: string;
  name: string;
  skinId: SkinId;
  snapshot: GhostSnapshot;
  /** ms since this player's newest snapshot — lets the renderer fade out ghosts that stopped updating. */
  staleMs: number;
  /** Stable per-player index (join order among remote players), used to pick a distinct tint. */
  slot: number;
}

/** Notifications back to React (the room hook). */
export type MultiplayerCallbacks = {
  onPlayersUpdate?: (players: PlayerInfo[]) => void;
};

/**
 * Bridge between the game Engine and the WebSocket connection.
 * The Engine stays network-unaware — it just calls sendLocalState()
 * and getGhostPlayers() without knowing about sockets.
 */
export class MultiplayerAdapter {
  private ws: WebSocket | null = null;
  private buffers = new Map<string, InterpolationBuffer>();
  private players = new Map<string, PlayerInfo>();
  private localPlayerId: string;
  private lastSendTime = 0;
  private callbacks: MultiplayerCallbacks;
  /**
   * The ghost list handed to the renderer, rebuilt in place every frame: one entry per slot,
   * reused so drawing ghosts allocates nothing per frame (see AI_INSTRUCTIONS.md).
   */
  private readonly ghostPool: GhostPlayer[] = [];
  private readonly ghosts: GhostPlayer[] = [];

  constructor(
    ws: WebSocket,
    localPlayerId: string,
    players: PlayerInfo[],
    callbacks: MultiplayerCallbacks = {}
  ) {
    this.ws = ws;
    this.localPlayerId = localPlayerId;
    this.callbacks = callbacks;

    for (const p of players) {
      // Own copies: we mutate scores/alive here, and these objects must not alias React state
      this.players.set(p.id, { ...p });
      if (p.id !== localPlayerId) {
        this.buffers.set(p.id, new InterpolationBuffer());
      }
    }
  }

  /** Handle incoming server messages. Called by the hook's onmessage handler. */
  handleServerMessage(msg: ServerMessage): void {
    switch (msg.type) {
      case "ghost_update": {
        let buf = this.buffers.get(msg.playerId);
        if (!buf) {
          buf = new InterpolationBuffer();
          this.buffers.set(msg.playerId, buf);
        }
        buf.push(msg.snapshot, performance.now());
        const player = this.players.get(msg.playerId);
        if (player?.alive && Number.isFinite(msg.snapshot.s)) player.score = msg.snapshot.s;
        break;
      }
      case "player_crashed": {
        const player = this.players.get(msg.playerId);
        if (player) {
          player.alive = false;
          player.score = msg.score;
        }
        this.callbacks.onPlayersUpdate?.(this.getPlayers());
        break;
      }
      case "player_joined": {
        this.players.set(msg.player.id, { ...msg.player });
        if (msg.player.id !== this.localPlayerId) {
          this.buffers.set(msg.player.id, new InterpolationBuffer());
        }
        this.callbacks.onPlayersUpdate?.(this.getPlayers());
        break;
      }
      case "player_left": {
        this.players.delete(msg.playerId);
        this.buffers.delete(msg.playerId);
        this.callbacks.onPlayersUpdate?.(this.getPlayers());
        break;
      }
    }
  }

  /**
   * Whether sendLocalState() would send now (snapshots go out at ~15 Hz). Lets the Engine
   * skip building a snapshot on the frames in between, which it would otherwise do at 60 Hz.
   * @param nowMs - performance.now().
   */
  shouldSend(nowMs: number): boolean {
    return nowMs - this.lastSendTime >= NETWORK_SYNC_INTERVAL_MS;
  }

  /** Send local player state — throttled to ~15 Hz internally. */
  sendLocalState(snapshot: GhostSnapshot): void {
    const now = performance.now();
    if (!this.shouldSend(now)) return;
    this.lastSendTime = now;

    this.send({ type: "player_update", snapshot });

    // Update local player's score in our map
    const local = this.players.get(this.localPlayerId);
    if (local) local.score = snapshot.s;
  }

  /** Notify server that local player crashed. */
  sendCrashed(score: number): void {
    const local = this.players.get(this.localPlayerId);
    if (local) {
      local.alive = false;
      local.score = score;
    }
    this.send({ type: "player_crashed", score });
  }

  /**
   * Interpolated ghost player states for rendering (called every frame).
   * The array and its entries (snapshots included) are reused across calls: read them
   * this frame, never keep them.
   */
  getGhostPlayers(): readonly GhostPlayer[] {
    const now = performance.now();
    const ghosts = this.ghosts;
    ghosts.length = 0;
    let slot = 0;

    // Walk players (join order), not buffers, so a ghost keeps its slot/colour even
    // while another player has no snapshots yet
    for (const player of this.players.values()) {
      if (player.id === this.localPlayerId) continue;
      const playerSlot = slot++;
      const buf = this.buffers.get(player.id);
      const snapshot = buf?.get(now);
      if (!buf || !snapshot) continue;

      const ghost = (this.ghostPool[playerSlot] ??= { id: "", name: "", skinId: "default", snapshot, staleMs: 0, slot: 0 });
      ghost.id = player.id;
      ghost.name = player.name;
      ghost.skinId = player.skinId;
      ghost.snapshot = snapshot;
      ghost.staleMs = buf.msSinceLatest(now);
      ghost.slot = playerSlot;
      ghosts.push(ghost);
    }
    return ghosts;
  }

  /**
   * Snapshot of every player with live scores (for HUD standings).
   * Returns copies so callers — notably React state — never alias the objects we mutate.
   */
  getPlayers(): PlayerInfo[] {
    return Array.from(this.players.values(), (p) => ({ ...p }));
  }

  /**
   * True once the server has counted the local player out (e.g. their tab was
   * hidden past the stale timeout), so the Engine can end a run the race no longer counts.
   */
  isLocalEliminated(): boolean {
    return this.players.get(this.localPlayerId)?.alive === false;
  }

  private send(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  /** Clean up. */
  destroy(): void {
    this.ws = null;
    this.buffers.clear();
    this.players.clear();
  }
}
