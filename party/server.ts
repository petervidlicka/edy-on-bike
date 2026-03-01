import type * as Party from "partykit/server";

// ── Types ──────────────────────────────────────────────────────────────

type RoomPhase = "lobby" | "countdown" | "racing" | "finished";

interface PlayerInfo {
  id: string;
  name: string;
  skinId: string;
  ready: boolean;
  alive: boolean;
  score: number;
}

interface RankingEntry {
  playerId: string;
  name: string;
  skinId: string;
  score: number;
  rank: number;
}

// ── Server ─────────────────────────────────────────────────────────────

export default class MultiplayerServer implements Party.Server {
  players: Map<string, PlayerInfo> = new Map();
  connections: Map<string, Party.Connection> = new Map();
  phase: RoomPhase = "lobby";
  seed: number;
  inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  countdownTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly room: Party.Room) {
    this.seed = Math.floor(Math.random() * 2147483647);
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Don't add as player yet — wait for "join" message.
    // Connection is already tracked by PartyKit internally;
    // we store it in our map only after a successful join.
    this.resetInactivityTimer();
  }

  onMessage(message: string | ArrayBuffer | ArrayBufferView, sender: Party.Connection) {
    if (typeof message !== "string") return;

    let data: any;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    this.resetInactivityTimer();

    switch (data.type) {
      case "join":
        this.handleJoin(data, sender);
        break;
      case "ready":
        this.handleReady(sender);
        break;
      case "player_update":
        this.handlePlayerUpdate(data, sender);
        break;
      case "player_crashed":
        this.handlePlayerCrashed(data, sender);
        break;
      case "leave":
        this.handleLeave(sender);
        break;
    }
  }

  onClose(conn: Party.Connection) {
    const player = this.players.get(conn.id);
    if (!player) {
      return;
    }

    // If the player was in a race and still alive, treat as a crash
    if ((this.phase === "racing" || this.phase === "countdown") && player.alive) {
      player.alive = false;
      this.broadcast(
        { type: "player_crashed", playerId: player.id, score: player.score },
      );
    }

    this.broadcast(
      { type: "player_left", playerId: player.id },
      player.id,
    );

    this.players.delete(conn.id);
    this.connections.delete(conn.id);

    this.checkFinishCondition();

    if (this.players.size === 0) {
      this.cleanup();
    }
  }

  // ── Message handlers ─────────────────────────────────────────────────

  private handleJoin(data: { type: "join"; name: string; skinId: string }, sender: Party.Connection) {
    if (this.phase !== "lobby") {
      sender.send(JSON.stringify({ type: "error", message: "Game already in progress" }));
      return;
    }

    if (this.players.size >= 4) {
      sender.send(JSON.stringify({ type: "error", message: "Room is full" }));
      return;
    }

    const playerInfo: PlayerInfo = {
      id: sender.id,
      name: data.name,
      skinId: data.skinId,
      ready: false,
      alive: true,
      score: 0,
    };

    this.players.set(sender.id, playerInfo);
    this.connections.set(sender.id, sender);

    // Send room_joined to the joining player
    sender.send(JSON.stringify({
      type: "room_joined",
      roomCode: this.room.id,
      playerId: sender.id,
      players: Array.from(this.players.values()),
      phase: this.phase,
      seed: this.seed,
    }));

    // Broadcast player_joined to everyone else
    this.broadcast(
      { type: "player_joined", player: playerInfo },
      sender.id,
    );
  }

  private handleReady(sender: Party.Connection) {
    const player = this.players.get(sender.id);
    if (!player) return;

    player.ready = true;

    this.broadcast({ type: "player_ready", playerId: sender.id });

    // Check if all players are ready and there are at least 2
    if (this.players.size >= 2 && this.allPlayersReady()) {
      this.startCountdown();
    }
  }

  private handlePlayerUpdate(data: { type: "player_update"; snapshot: unknown }, sender: Party.Connection) {
    // Relay ghost snapshot to all other players
    this.broadcast(
      { type: "ghost_update", playerId: sender.id, snapshot: data.snapshot },
      sender.id,
    );
  }

  private handlePlayerCrashed(data: { type: "player_crashed"; score: number }, sender: Party.Connection) {
    const player = this.players.get(sender.id);
    if (!player) return;

    player.alive = false;
    player.score = data.score;

    this.broadcast({
      type: "player_crashed",
      playerId: sender.id,
      score: data.score,
    });

    this.checkFinishCondition();
  }

  private handleLeave(sender: Party.Connection) {
    const player = this.players.get(sender.id);
    if (!player) return;

    this.players.delete(sender.id);
    this.connections.delete(sender.id);

    this.broadcast(
      { type: "player_left", playerId: player.id },
    );

    this.checkFinishCondition();

    if (this.players.size === 0) {
      this.cleanup();
    }
  }

  // ── Game flow ────────────────────────────────────────────────────────

  private startCountdown() {
    this.phase = "countdown";
    this.seed = Math.floor(Math.random() * 2147483647);
    const startAtMs = Date.now() + 3000;

    this.broadcast({
      type: "countdown_start",
      startAtMs,
      seed: this.seed,
    });

    this.countdownTimer = setTimeout(() => {
      this.phase = "racing";
      this.broadcast({ type: "race_start" });
    }, 3000);
  }

  private checkFinishCondition() {
    if (this.phase !== "racing") return;

    const allDead = Array.from(this.players.values()).every((p) => !p.alive);
    if (allDead) {
      this.finishRace();
    }
  }

  private finishRace() {
    this.phase = "finished";

    const sorted = Array.from(this.players.values()).sort(
      (a, b) => b.score - a.score,
    );

    const rankings: RankingEntry[] = sorted.map((p, i) => ({
      playerId: p.id,
      name: p.name,
      skinId: p.skinId,
      score: p.score,
      rank: i + 1,
    }));

    this.broadcast({ type: "race_finished", rankings });

    // Auto-cleanup after 5 minutes
    setTimeout(() => {
      for (const conn of this.connections.values()) {
        conn.close();
      }
    }, 5 * 60 * 1000);
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private broadcast(msg: Record<string, unknown>, excludeId?: string) {
    const raw = JSON.stringify(msg);
    for (const [id, conn] of this.connections) {
      if (id !== excludeId) {
        conn.send(raw);
      }
    }
  }

  private allPlayersReady(): boolean {
    for (const player of this.players.values()) {
      if (!player.ready) return false;
    }
    return true;
  }

  private resetInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    this.inactivityTimer = setTimeout(() => {
      for (const conn of this.connections.values()) {
        conn.close();
      }
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
  }
}

MultiplayerServer satisfies Party.Worker;
