/**
 * Pure quick-play queue: who is waiting, when the current wait ends, and the per-IP caps.
 * It never touches a socket or a clock — every method takes `now` and returns the messages
 * to send, the sockets to close and the single deadline timer to (re)arm — so the
 * wait/grace/lonely/match policy is unit testable. Matchmaker (matchmaker.ts) is the I/O
 * glue that feeds it socket events.
 */
import {
  MAX_PLAYERS,
  QUICK_PLAY_CODE_PREFIX,
  QUICK_PLAY_CODE_RANDOM_LENGTH,
  QUICK_PLAY_GRACE_MS,
  QUICK_PLAY_WAIT_MS,
  randomRoomCode,
} from "../game/multiplayer/protocol";
import type { MatchmakerServerMessage } from "../game/multiplayer/protocol";

// ── Limits ─────────────────────────────────────────────────────────────

/** A socket that hasn't queued by now is closed; the client queues as soon as it opens. */
export const QUEUE_TIMEOUT_MS = 10_000;

/**
 * Per-IP limits, so one client can't fill matches with sockets that never join the room
 * (each such no-show stalls real riders for the room's gather wait, then re-queues them).
 * Two queued riders per IP still lets a household or classroom search side by side.
 */
export const MAX_SOCKETS_PER_IP = 4;
export const MAX_QUEUED_PER_IP = 2;
/** Matches per IP per window: a real rider needs ~30s+ per race, so this only bites bots. */
export const MAX_MATCHES_PER_IP = 10;
export const MATCH_WINDOW_MS = 2 * 60 * 1000;

// ── Effects ────────────────────────────────────────────────────────────

/** Arm (replacing the armed one) or disarm the queue's single deadline timer. */
export type QueueTimerIntent = { kind: "schedule"; inMs: number } | { kind: "cancel" };

/** Everything a queue transition asks the glue to do: sends first, then closes, then timers. */
export interface QueueEffects {
  outbox: { to: string; msg: MatchmakerServerMessage }[];
  closes: { id: string; code: number; reason: string }[];
  timers: QueueTimerIntent[];
}

function newEffects(): QueueEffects {
  return { outbox: [], closes: [], timers: [] };
}

// ── Policy ─────────────────────────────────────────────────────────────

/**
 * Groups queued riders into races of 2–4. A first rider waits QUICK_PLAY_WAIT_MS; once a
 * lone rider has outlasted that, each newcomer only holds the match for QUICK_PLAY_GRACE_MS;
 * a 4th rider matches everyone immediately.
 * @example
 * const policy = new QueuePolicy(() => "QABCDE");
 * policy.connect("s1", "1.2.3.4");
 * const fx = policy.enqueue("s1", 0); // fx.timers → [{ kind: "schedule", inMs: QUICK_PLAY_WAIT_MS }]
 */
export class QueuePolicy {
  /** Queued socket ids in arrival order — Set iteration order is insertion order. */
  readonly queue: Set<string> = new Set();
  /** When the current wait ends, or null while nobody's wait is counting down. */
  deadline: number | null = null;
  /** Client IP of each registered socket. */
  private readonly socketIps: Map<string, string> = new Map();
  /** Recent match times per IP, pruned to MATCH_WINDOW_MS. */
  private readonly recentMatches: Map<string, number[]> = new Map();

  /** @param nextRoomCode - Room code source; injectable so tests get deterministic codes. */
  constructor(
    private readonly nextRoomCode: () => string = () =>
      randomRoomCode(QUICK_PLAY_CODE_RANDOM_LENGTH, QUICK_PLAY_CODE_PREFIX),
  ) {}

  /** Registers a new socket, or closes it when its IP already has MAX_SOCKETS_PER_IP open. */
  connect(id: string, ip: string): QueueEffects {
    const fx = newEffects();
    if (this.countSocketsFrom(ip) >= MAX_SOCKETS_PER_IP) {
      fx.closes.push({ id, code: 1013, reason: "Too many connections" });
      return fx;
    }
    this.socketIps.set(id, ip);
    return fx;
  }

  /** Whether the socket has queued (or is already gone), for the queue-timeout close. */
  isSettled(id: string): boolean {
    return !this.socketIps.has(id) || this.queue.has(id);
  }

  /** The "queue" message: joins the queue, or closes a socket over its IP's search caps. */
  enqueue(id: string, now: number): QueueEffects {
    const fx = newEffects();
    // Only sockets registered on connect (ids are server-generated, see index.ts) may queue
    const ip = this.socketIps.get(id);
    if (ip === undefined || this.queue.has(id)) return fx;
    if (this.countQueuedFrom(ip) >= MAX_QUEUED_PER_IP || !this.underMatchLimit(ip, now)) {
      fx.closes.push({ id, code: 1013, reason: "Too many searches" });
      return fx;
    }

    this.queue.add(id);
    if (this.queue.size >= MAX_PLAYERS) {
      this.match(fx, now);
    } else {
      this.armDeadline(fx, now);
    }
    this.broadcastStatus(fx, now);
    return fx;
  }

  /** The socket closed (left the queue, was matched, or timed out). */
  close(id: string, now: number): QueueEffects {
    const fx = newEffects();
    this.socketIps.delete(id);
    if (!this.queue.delete(id)) return fx;
    if (this.queue.size === 0) this.clearDeadline(fx);
    this.broadcastStatus(fx, now);
    return fx;
  }

  /** The wait ran out: match whoever is queued, or tell a lone rider nobody came. */
  onDeadline(now: number): QueueEffects {
    const fx = newEffects();
    this.deadline = null;
    if (this.queue.size >= 2) {
      this.match(fx, now);
      this.broadcastStatus(fx, now);
      return fx;
    }
    // Nobody came: the rider stays queued (the next arrival triggers a grace-length wait)
    for (const id of this.queue) fx.outbox.push({ to: id, msg: { type: "queue_lonely" } });
    this.broadcastStatus(fx, now);
    return fx;
  }

  // ── Internals ────────────────────────────────────────────────────────

  /**
   * Starts the countdown if none is running. A first rider gets the full wait; when a lone
   * rider already outlasted it, the newcomer only holds the match for the short grace.
   */
  private armDeadline(fx: QueueEffects, now: number) {
    if (this.deadline !== null) return;
    const waitMs = this.queue.size >= 2 ? QUICK_PLAY_GRACE_MS : QUICK_PLAY_WAIT_MS;
    this.deadline = now + waitMs;
    fx.timers.push({ kind: "schedule", inMs: waitMs });
  }

  private clearDeadline(fx: QueueEffects) {
    this.deadline = null;
    fx.timers.push({ kind: "cancel" });
  }

  /** Sends the first (up to) MAX_PLAYERS riders to a fresh room; the rest keep waiting. */
  private match(fx: QueueEffects, now: number) {
    this.clearDeadline(fx);
    const group = Array.from(this.queue).slice(0, MAX_PLAYERS);
    // Q + 5 characters: never the 4-character shape of a typed friend code
    const roomCode = this.nextRoomCode();
    this.pruneMatchHistory(now);
    for (const id of group) {
      this.queue.delete(id);
      const ip = this.socketIps.get(id);
      if (ip !== undefined) this.recentMatches.set(ip, [...(this.recentMatches.get(ip) ?? []), now]);
      fx.outbox.push({ to: id, msg: { type: "matched", roomCode, expected: group.length } });
      // A matched socket's job is done; closing it means it can't simply queue again
      fx.closes.push({ id, code: 1000, reason: "Matched" });
    }
    if (this.queue.size > 0) this.armDeadline(fx, now);
  }

  private broadcastStatus(fx: QueueEffects, now: number) {
    const msLeft = this.deadline === null ? null : Math.max(0, this.deadline - now);
    for (const id of this.queue) {
      fx.outbox.push({ to: id, msg: { type: "queue_status", waiting: this.queue.size, msLeft } });
    }
  }

  private countSocketsFrom(ip: string): number {
    let count = 0;
    for (const socketIp of this.socketIps.values()) if (socketIp === ip) count++;
    return count;
  }

  private countQueuedFrom(ip: string): number {
    let count = 0;
    for (const id of this.queue) if (this.socketIps.get(id) === ip) count++;
    return count;
  }

  /** Whether this IP may be matched again within MATCH_WINDOW_MS. */
  private underMatchLimit(ip: string, now: number): boolean {
    const cutoff = now - MATCH_WINDOW_MS;
    const recent = (this.recentMatches.get(ip) ?? []).filter((at) => at > cutoff);
    return recent.length < MAX_MATCHES_PER_IP;
  }

  /** Drops match times outside the window, so the single global instance doesn't grow forever. */
  private pruneMatchHistory(now: number) {
    const cutoff = now - MATCH_WINDOW_MS;
    for (const [ip, times] of this.recentMatches) {
      const recent = times.filter((at) => at > cutoff);
      if (recent.length === 0) this.recentMatches.delete(ip);
      else this.recentMatches.set(ip, recent);
    }
  }
}
