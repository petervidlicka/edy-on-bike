/**
 * Quick-play matchmaker: a single PartyServer Durable Object (clients always connect
 * to /parties/matchmaker/global) that groups waiting riders and hands each group a
 * fresh room code. The race itself runs in a normal MultiplayerServer room (server.ts),
 * which the matched clients join with intent "quick".
 */
import { Server, type Connection } from "partyserver";
import {
  MAX_PLAYERS,
  QUICK_PLAY_CODE_PREFIX,
  QUICK_PLAY_GRACE_MS,
  QUICK_PLAY_WAIT_MS,
} from "../game/multiplayer/protocol";
import type { MatchmakerServerMessage } from "../game/multiplayer/protocol";

/** Only message the matchmaker accepts; anything bigger is junk. */
const MAX_MESSAGE_CHARS = 64;

/** Same alphabet as friend-room codes: no I/O/0/1 to avoid confusion. */
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_RANDOM_LENGTH = 5;

/** Groups queued riders into races of 2–4 (see QUICK_PLAY_WAIT_MS / QUICK_PLAY_GRACE_MS). */
export class Matchmaker extends Server {
  /** The deadline timer lives in memory, so stay resident while anyone is queued. */
  static options = { hibernate: false };

  /** Queued sockets in arrival order — Map iteration order is insertion order. */
  queue: Map<string, Connection> = new Map();
  /** When the current wait ends (Date.now), or null while nobody's wait is counting down. */
  deadline: number | null = null;
  deadlineTimer: ReturnType<typeof setTimeout> | null = null;

  onMessage(sender: Connection, message: string | ArrayBuffer | ArrayBufferView) {
    if (typeof message !== "string" || message.length > MAX_MESSAGE_CHARS) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }
    if (typeof parsed !== "object" || parsed === null || (parsed as { type?: unknown }).type !== "queue") return;
    if (this.queue.has(sender.id)) return;

    this.queue.set(sender.id, sender);
    if (this.queue.size >= MAX_PLAYERS) {
      this.match();
    } else {
      this.armDeadline();
    }
    this.broadcastStatus();
  }

  onClose(conn: Connection) {
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
    const roomCode = generateQuickPlayCode();
    for (const conn of group) {
      this.queue.delete(conn.id);
      this.send(conn, { type: "matched", roomCode, expected: group.length });
    }
    if (this.queue.size > 0) this.armDeadline();
  }

  private broadcastStatus() {
    const msLeft = this.deadline === null ? null : Math.max(0, this.deadline - Date.now());
    const raw = JSON.stringify({ type: "queue_status", waiting: this.queue.size, msLeft } satisfies MatchmakerServerMessage);
    for (const conn of this.queue.values()) conn.send(raw);
  }

  private send(conn: Connection, msg: MatchmakerServerMessage) {
    conn.send(JSON.stringify(msg));
  }
}

/** @returns A code like "Q7KX2M" — never the 4-character shape of a typed friend code. */
function generateQuickPlayCode(): string {
  let code = QUICK_PLAY_CODE_PREFIX;
  for (let i = 0; i < CODE_RANDOM_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}
