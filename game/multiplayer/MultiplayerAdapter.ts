import type { GhostSnapshot, PlayerInfo, RankingEntry, ServerMessage, ClientMessage } from "./types";
import { InterpolationBuffer } from "./interpolation";

const SYNC_INTERVAL_MS = 67; // ~15 Hz

export interface GhostPlayer {
  id: string;
  name: string;
  skinId: string;
  snapshot: GhostSnapshot;
}

export type MultiplayerCallbacks = {
  onRemotePlayerCrashed?: (playerId: string, score: number) => void;
  onRaceFinished?: (rankings: RankingEntry[]) => void;
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
  private startTimeMs = 0;

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
      this.players.set(p.id, p);
      if (p.id !== localPlayerId) {
        this.buffers.set(p.id, new InterpolationBuffer());
      }
    }
  }

  /** Call once when the race actually starts (after countdown). */
  markRaceStart(): void {
    this.startTimeMs = performance.now();
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
        buf.push(msg.snapshot);
        break;
      }
      case "player_crashed": {
        const player = this.players.get(msg.playerId);
        if (player) {
          player.alive = false;
          player.score = msg.score;
        }
        this.callbacks.onRemotePlayerCrashed?.(msg.playerId, msg.score);
        this.callbacks.onPlayersUpdate?.(Array.from(this.players.values()));
        break;
      }
      case "player_joined": {
        this.players.set(msg.player.id, msg.player);
        if (msg.player.id !== this.localPlayerId) {
          this.buffers.set(msg.player.id, new InterpolationBuffer());
        }
        this.callbacks.onPlayersUpdate?.(Array.from(this.players.values()));
        break;
      }
      case "player_left": {
        this.players.delete(msg.playerId);
        this.buffers.delete(msg.playerId);
        this.callbacks.onPlayersUpdate?.(Array.from(this.players.values()));
        break;
      }
      case "race_finished": {
        this.callbacks.onRaceFinished?.(msg.rankings);
        break;
      }
    }
  }

  /** Send local player state — throttled to ~15 Hz internally. */
  sendLocalState(snapshot: GhostSnapshot): void {
    const now = performance.now();
    if (now - this.lastSendTime < SYNC_INTERVAL_MS) return;
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

  /** Get interpolated ghost player states for rendering (called every frame). */
  getGhostPlayers(): GhostPlayer[] {
    const now = performance.now();
    const ghosts: GhostPlayer[] = [];

    for (const [id, buf] of this.buffers) {
      if (id === this.localPlayerId) continue;
      const snapshot = buf.get(now);
      if (!snapshot) continue;
      const player = this.players.get(id);
      if (!player) continue;

      ghosts.push({
        id,
        name: player.name,
        skinId: player.skinId,
        snapshot,
      });
    }
    return ghosts;
  }

  /** Get all players info (for HUD standings). */
  getPlayers(): PlayerInfo[] {
    return Array.from(this.players.values());
  }

  /** Get local player ID. */
  getLocalPlayerId(): string {
    return this.localPlayerId;
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
