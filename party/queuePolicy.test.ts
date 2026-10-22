import { describe, expect, it } from "vitest";
import {
  MATCH_WINDOW_MS,
  MAX_MATCHES_PER_IP,
  MAX_QUEUED_PER_IP,
  MAX_SOCKETS_PER_IP,
  QueuePolicy,
  type QueueEffects,
} from "./queuePolicy";
import { MAX_PLAYERS, QUICK_PLAY_GRACE_MS, QUICK_PLAY_WAIT_MS } from "../game/multiplayer/protocol";
import type { MatchmakerServerMessage } from "../game/multiplayer/protocol";

const ROOM = "QABCDE";

function policy(): QueuePolicy {
  return new QueuePolicy(() => ROOM);
}

/** Registers and queues `id` from `ip` at `now`, returning the queue effects. */
function queueUp(p: QueuePolicy, id: string, now: number, ip = `ip-${id}`): QueueEffects {
  p.connect(id, ip);
  return p.enqueue(id, now);
}

function sent<T extends MatchmakerServerMessage["type"]>(fx: QueueEffects, type: T) {
  return fx.outbox.filter((o): o is typeof o & { msg: Extract<MatchmakerServerMessage, { type: T }> } => o.msg.type === type);
}

describe("QueuePolicy waiting", () => {
  it("gives the first rider the full wait and reports it to everyone queued", () => {
    const p = policy();
    const fx = queueUp(p, "a", 1000);
    expect(fx.timers).toEqual([{ kind: "schedule", inMs: QUICK_PLAY_WAIT_MS }]);
    expect(sent(fx, "queue_status")).toEqual([
      { to: "a", msg: { type: "queue_status", waiting: 1, msLeft: QUICK_PLAY_WAIT_MS } },
    ]);

    const second = queueUp(p, "b", 6000);
    expect(second.timers).toEqual([]); // the running wait is kept
    expect(sent(second, "queue_status").map((o) => o.msg)).toEqual([
      { type: "queue_status", waiting: 2, msLeft: QUICK_PLAY_WAIT_MS - 5000 },
      { type: "queue_status", waiting: 2, msLeft: QUICK_PLAY_WAIT_MS - 5000 },
    ]);
  });

  it("matches everyone queued when the wait ends", () => {
    const p = policy();
    queueUp(p, "a", 0);
    queueUp(p, "b", 1000);
    const fx = p.onDeadline(QUICK_PLAY_WAIT_MS);
    expect(sent(fx, "matched").map((o) => [o.to, o.msg.roomCode, o.msg.expected])).toEqual([
      ["a", ROOM, 2],
      ["b", ROOM, 2],
    ]);
    expect(fx.closes).toEqual([
      { id: "a", code: 1000, reason: "Matched" },
      { id: "b", code: 1000, reason: "Matched" },
    ]);
    expect(fx.timers).toEqual([{ kind: "cancel" }]);
    expect(p.queue.size).toBe(0);
  });

  it("tells a lone rider nobody came, then only holds the next arrival for the grace", () => {
    const p = policy();
    queueUp(p, "a", 0);
    const lonely = p.onDeadline(QUICK_PLAY_WAIT_MS);
    expect(lonely.outbox.map((o) => o.msg.type)).toEqual(["queue_lonely", "queue_status"]);
    expect(sent(lonely, "queue_status")[0]?.msg.msLeft).toBeNull();
    expect(p.deadline).toBeNull();

    const fx = queueUp(p, "b", 20_000);
    expect(fx.timers).toEqual([{ kind: "schedule", inMs: QUICK_PLAY_GRACE_MS }]);
    expect(sent(p.onDeadline(20_000 + QUICK_PLAY_GRACE_MS), "matched")).toHaveLength(2);
  });

  it("matches a full group of MAX_PLAYERS immediately and keeps the rest waiting", () => {
    const p = policy();
    for (let i = 0; i < MAX_PLAYERS - 1; i++) queueUp(p, `r${i}`, i);
    const fx = queueUp(p, "last", 100);
    expect(sent(fx, "matched")).toHaveLength(MAX_PLAYERS);
    expect(sent(fx, "matched")[0]?.msg.expected).toBe(MAX_PLAYERS);
    expect(p.queue.size).toBe(0);
  });

  it("starts a fresh full wait for the first rider after a match", () => {
    const p = policy();
    queueUp(p, "a", 0);
    queueUp(p, "b", 0);
    p.onDeadline(QUICK_PLAY_WAIT_MS);
    expect(p.deadline).toBeNull();
    const fx = queueUp(p, "x", 30_000);
    expect(fx.timers).toEqual([{ kind: "schedule", inMs: QUICK_PLAY_WAIT_MS }]);
    expect(sent(fx, "queue_status")[0]?.msg).toEqual({ type: "queue_status", waiting: 1, msLeft: QUICK_PLAY_WAIT_MS });
  });

  it("drops a rider who leaves and clears the wait when the queue empties", () => {
    const p = policy();
    queueUp(p, "a", 0);
    queueUp(p, "b", 0);
    const left = p.close("a", 1000);
    expect(sent(left, "queue_status")).toEqual([{ to: "b", msg: { type: "queue_status", waiting: 1, msLeft: QUICK_PLAY_WAIT_MS - 1000 } }]);
    expect(left.timers).toEqual([]);
    const empty = p.close("b", 2000);
    expect(empty.timers).toEqual([{ kind: "cancel" }]);
    expect(p.close("ghost", 3000)).toEqual({ outbox: [], closes: [], timers: [] });
  });
});

describe("QueuePolicy per-IP caps", () => {
  it("refuses a socket beyond MAX_SOCKETS_PER_IP", () => {
    const p = policy();
    for (let i = 0; i < MAX_SOCKETS_PER_IP; i++) expect(p.connect(`s${i}`, "shared").closes).toEqual([]);
    expect(p.connect("extra", "shared").closes).toEqual([{ id: "extra", code: 1013, reason: "Too many connections" }]);
    expect(p.isSettled("extra")).toBe(true); // never registered, so the timeout close is moot
  });

  it("refuses a search beyond MAX_QUEUED_PER_IP, and from unregistered sockets", () => {
    const p = policy();
    for (let i = 0; i < MAX_QUEUED_PER_IP; i++) expect(queueUp(p, `q${i}`, 0, "shared").closes).toEqual([]);
    expect(queueUp(p, "third", 0, "shared").closes).toEqual([{ id: "third", code: 1013, reason: "Too many searches" }]);
    expect(p.enqueue("stranger", 0)).toEqual({ outbox: [], closes: [], timers: [] });
    expect(p.isSettled("q0")).toBe(true);
    expect(p.isSettled("third")).toBe(false);
  });

  it("limits matches per IP within MATCH_WINDOW_MS", () => {
    const p = policy();
    let now = 0;
    for (let i = 0; i < MAX_MATCHES_PER_IP; i++) {
      queueUp(p, `bot${i}`, now, "bot");
      queueUp(p, `other${i}`, now);
      expect(sent(p.onDeadline(now + QUICK_PLAY_WAIT_MS), "matched")).toHaveLength(2);
      p.close(`bot${i}`, now);
      p.close(`other${i}`, now);
      now += 1000;
    }
    expect(queueUp(p, "botX", now, "bot").closes).toEqual([{ id: "botX", code: 1013, reason: "Too many searches" }]);
    // The window slides: once every match has aged out, the IP may search again
    const lastMatchAt = now - 1000 + QUICK_PLAY_WAIT_MS;
    expect(queueUp(p, "botY", lastMatchAt + MATCH_WINDOW_MS + 1, "bot").closes).toEqual([]);
  });
});
