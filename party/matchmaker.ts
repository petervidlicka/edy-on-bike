/**
 * Quick-play matchmaker: a single PartyServer Durable Object (clients always connect
 * to /parties/matchmaker/global) that groups waiting riders and hands each group a
 * fresh room code. The race itself runs in a normal MultiplayerServer room (server.ts),
 * which the matched clients join with intent "quick".
 */
import { Server, type Connection, type ConnectionContext } from "partyserver";
import {
  MAX_PLAYERS,
  QUICK_PLAY_CODE_PREFIX,
  QUICK_PLAY_CODE_RANDOM_LENGTH,
  QUICK_PLAY_GRACE_MS,
  QUICK_PLAY_WAIT_MS,
  randomRoomCode,
} from "../game/multiplayer/protocol";
import type { MatchmakerServerMessage } from "../game/multiplayer/protocol";
import { MESSAGE_BURST, MESSAGE_RATE_PER_SEC, TokenBucket } from "./validation";
import { closeUnlessBy, parseIncoming, sendJson } from "./socket";

/** Only message the matchmaker accepts; anything bigger is junk. */
const MAX_MESSAGE_CHARS = 64;

/** A socket that hasn't queued by now is closed; the client queues as soon as it opens. */
const QUEUE_TIMEOUT_MS = 10_000;

/**
 * Per-IP limits, so one client can't fill matches with sockets that never join the room
 * (each such no-show stalls real riders for the room's gather wait, then re-queues them).
 * Two queued riders per IP still lets a household or classroom search side by side.
 */
const MAX_SOCKETS_PER_IP = 4;
const MAX_QUEUED_PER_IP = 2;
/** Matches per IP per window: a real rider needs ~30s+ per race, so this only bites bots. */
const MAX_MATCHES_PER_IP = 10;
const MATCH_WINDOW_MS = 2 * 60 * 1000;

/** Groups queued riders into races of 2–4 (see QUICK_PLAY_WAIT_MS / QUICK_PLAY_GRACE_MS). */
export class Matchmaker extends Server {
  /** The deadline timer lives in memory, so stay resident while anyone is queued. */
  static options = { hibernate: false };

  /** Queued sockets in arrival order — Map iteration order is insertion order. */
  queue: Map<string, Connection> = new Map();
  /** When the current wait ends (Date.now), or null while nobody's wait is counting down. */
  deadline: number | null = null;
  deadlineTimer: ReturnType<typeof setTimeout> | null = null;
  /** Client IP of each open socket (Cloudflare's cf-connecting-ip). */
  socketIps: Map<string, string> = new Map();
  /** Recent match times per IP, pruned to MATCH_WINDOW_MS. */
  recentMatches: Map<string, number[]> = new Map();
  /** Per-socket message budget, checked before parsing — the same budget a room socket gets. */
  messageLimits: WeakMap<Connection, TokenBucket> = new WeakMap();

  onConnect(conn: Connection, ctx: ConnectionContext) {
    const ip = ctx.request.headers.get("cf-connecting-ip") ?? "unknown";
    if (this.countSocketsFrom(ip) >= MAX_SOCKETS_PER_IP) {
      conn.close(1013, "Too many connections");
      return;
    }
    this.socketIps.set(conn.id, ip);
    this.messageLimits.set(conn, new TokenBucket(MESSAGE_RATE_PER_SEC, MESSAGE_BURST, Date.now()));
    closeUnlessBy(
      conn,
      QUEUE_TIMEOUT_MS,
      () => !this.socketIps.has(conn.id) || this.queue.has(conn.id),
      "Queue timeout",
    );
  }

  onMessage(sender: Connection, message: string | ArrayBuffer | ArrayBufferView) {
    if (!this.messageLimits.get(sender)?.take(Date.now())) return; // flooding — drop unparsed
    const parsed = parseIncoming(message, MAX_MESSAGE_CHARS);
    if (!parsed || parsed.type !== "queue") return;
    // Only sockets we registered on connect (ids are server-generated, see index.ts) may queue
    const ip = this.socketIps.get(sender.id);
    if (ip === undefined || this.queue.has(sender.id)) return;
    if (this.countQueuedFrom(ip) >= MAX_QUEUED_PER_IP || !this.underMatchLimit(ip)) {
      sender.close(1013, "Too many searches");
      return;
    }

    this.queue.set(sender.id, sender);
    if (this.queue.size >= MAX_PLAYERS) {
      this.match();
    } else {
      this.armDeadline();
    }
    this.broadcastStatus();
  }

  onClose(conn: Connection) {
    this.socketIps.delete(conn.id);
    if (!this.queue.delete(conn.id)) return;
    if (this.queue.size === 0) this.clearDeadline();
    this.broadcastStatus();
  }

  /**
   * Starts the countdown if none is running. A first rider gets the full wait; when a lone
   * rider already outlasted it, the newcomer only holds the match for the short grace.
   */
  private armDeadline() {
    if (this.deadline !== null) return;
    const waitMs = this.queue.size >= 2 ? QUICK_PLAY_GRACE_MS : QUICK_PLAY_WAIT_MS;
    this.deadline = Date.now() + waitMs;
    this.deadlineTimer = setTimeout(() => this.onDeadline(), waitMs);
  }

  private clearDeadline() {
    if (this.deadlineTimer) clearTimeout(this.deadlineTimer);
    this.deadlineTimer = null;
    this.deadline = null;
  }

  private onDeadline() {
    this.deadlineTimer = null;
    this.deadline = null;
    if (this.queue.size >= 2) {
      this.match();
      this.broadcastStatus();
      return;
    }
    // Nobody came: the rider stays queued (the next arrival triggers a grace-length wait)
    for (const conn of this.queue.values()) this.send(conn, { type: "queue_lonely" });
    this.broadcastStatus();
  }

  /** Sends the first (up to) MAX_PLAYERS riders to a fresh room; the rest keep waiting. */
  private match() {
    this.clearDeadline();
    const group = Array.from(this.queue.values()).slice(0, MAX_PLAYERS);
    // Q + 5 characters: never the 4-character shape of a typed friend code
    const roomCode = randomRoomCode(QUICK_PLAY_CODE_RANDOM_LENGTH, QUICK_PLAY_CODE_PREFIX);
    const now = Date.now();
    this.pruneMatchHistory(now);
    for (const conn of group) {
      this.queue.delete(conn.id);
      const ip = this.socketIps.get(conn.id);
      if (ip !== undefined) this.recentMatches.set(ip, [...(this.recentMatches.get(ip) ?? []), now]);
      this.send(conn, { type: "matched", roomCode, expected: group.length });
      // A matched socket's job is done; closing it means it can't simply queue again
      conn.close(1000, "Matched");
    }
    if (this.queue.size > 0) this.armDeadline();
  }

  private broadcastStatus() {
    const msLeft = this.deadline === null ? null : Math.max(0, this.deadline - Date.now());
    const raw = JSON.stringify({ type: "queue_status", waiting: this.queue.size, msLeft } satisfies MatchmakerServerMessage);
    for (const conn of this.queue.values()) conn.send(raw);
  }

  private send(conn: Connection, msg: MatchmakerServerMessage) {
    sendJson(conn, msg);
  }

  private countSocketsFrom(ip: string): number {
    let count = 0;
    for (const socketIp of this.socketIps.values()) if (socketIp === ip) count++;
    return count;
  }

  private countQueuedFrom(ip: string): number {
    let count = 0;
    for (const id of this.queue.keys()) if (this.socketIps.get(id) === ip) count++;
    return count;
  }

  /** Whether this IP may be matched again within MATCH_WINDOW_MS. */
  private underMatchLimit(ip: string): boolean {
    const cutoff = Date.now() - MATCH_WINDOW_MS;
    const recent = (this.recentMatches.get(ip) ?? []).filter((at) => at > cutoff);
    return recent.length < MAX_MATCHES_PER_IP;
  }

  /** Drops match times outside the window, so the single global instance doesn't grow forever. */
  private pruneMatchHistory(nowMs: number) {
    const cutoff = nowMs - MATCH_WINDOW_MS;
    for (const [ip, times] of this.recentMatches) {
      const recent = times.filter((at) => at > cutoff);
      if (recent.length === 0) this.recentMatches.delete(ip);
      else this.recentMatches.set(ip, recent);
    }
  }
}
