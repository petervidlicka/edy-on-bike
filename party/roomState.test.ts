import { describe, expect, it } from "vitest";
import {
  COUNTDOWN_MS,
  QUICK_GATHER_MS,
  RoomState,
  STALE_CHECK_INTERVAL_MS,
  STALE_PLAYER_MS,
  type JoinRequest,
  type RoomEffects,
} from "./roomState";
import { MAX_PLAYERS } from "../game/multiplayer/protocol";
import type { ServerMessage } from "../game/multiplayer/protocol";

const FRIEND_CODE = "ABCD";
const QUICK_CODE = "QABCDE";

function req(intent: string, overrides: Partial<JoinRequest> = {}): JoinRequest {
  return { name: "Edy", skinId: "default", intent, expected: undefined, ...overrides };
}

/** A room whose seeds count up from 1, so the countdown's fresh seed is checkable. */
function room(code: string): RoomState {
  let seed = 0;
  return new RoomState(code, () => ++seed);
}

/** Messages of one type in an outbox, with their addressing. */
function sent<T extends ServerMessage["type"]>(fx: RoomEffects, type: T) {
  return fx.outbox.filter((o): o is typeof o & { msg: Extract<ServerMessage, { type: T }> } => o.msg.type === type);
}

function errorMessage(fx: RoomEffects): string | undefined {
  return sent(fx, "error")[0]?.msg.message;
}

/** Friend room with two ready players, i.e. one in countdown. */
function countdownRoom(): RoomState {
  const r = room(FRIEND_CODE);
  r.join("a", req("create"));
  r.join("b", req("join"));
  r.ready("a");
  r.ready("b");
  expect(r.phase).toBe("countdown");
  return r;
}

/** Friend room with two players racing since t=1000. */
function racingRoom(): RoomState {
  const r = countdownRoom();
  r.onTimer("countdown", 1000);
  expect(r.phase).toBe("racing");
  return r;
}

describe("RoomState join guards", () => {
  it("admits a creator and tells only the others about later joiners", () => {
    const r = room(FRIEND_CODE);
    const created = r.join("a", req("create"));
    expect(sent(created, "room_joined")[0]).toMatchObject({
      to: "one", id: "a", msg: { roomCode: FRIEND_CODE, playerId: "a", phase: "lobby", seed: 1, quickPlay: false },
    });
    expect(created.timers).toEqual([]);

    const joined = r.join("b", req("join"));
    expect(sent(joined, "room_joined")[0]?.msg.players.map((p) => p.id)).toEqual(["a", "b"]);
    expect(sent(joined, "player_joined")[0]).toMatchObject({ to: "others", except: "b", msg: { player: { id: "b", ready: false } } });
  });

  it("rejects a join to an empty room (typo'd code) instead of opening one", () => {
    const fx = room(FRIEND_CODE).join("a", req("join"));
    expect(errorMessage(fx)).toContain(`No room found with code ${FRIEND_CODE}`);
    expect(fx.outbox[0]).toMatchObject({ to: "one", id: "a" });
  });

  it("flags a create on a code already in use so the client retries", () => {
    const r = room(FRIEND_CODE);
    r.join("a", req("create"));
    const fx = r.join("b", req("create"));
    expect(sent(fx, "error")[0]?.msg.reason).toBe("room_taken");
    expect(r.hasPlayer("b")).toBe(false);
  });

  it("rejects a join once the room is full", () => {
    const r = room(FRIEND_CODE);
    r.join("p0", req("create"));
    for (let i = 1; i < MAX_PLAYERS; i++) r.join(`p${i}`, req("join"));
    expect(errorMessage(r.join("late", req("join")))).toContain("full");
  });

  it("rejects a join once the race has started", () => {
    const r = countdownRoom();
    expect(errorMessage(r.join("c", req("join")))).toContain("already started");
  });

  it("ignores a duplicate join from the same socket", () => {
    const r = room(FRIEND_CODE);
    r.join("a", req("create"));
    expect(r.join("a", req("create"))).toEqual({ outbox: [], timers: [] });
  });

  it("keeps friend intents off quick-play codes and vice versa", () => {
    expect(errorMessage(room(QUICK_CODE).join("a", req("create")))).toContain("code isn't valid");
    expect(errorMessage(room(FRIEND_CODE).join("a", req("quick")))).toContain("code isn't valid");
  });

  it("rejects an unknown intent and an unusable name", () => {
    expect(errorMessage(room(FRIEND_CODE).join("a", req("spectate")))).toContain("isn't valid");
    expect(errorMessage(room(FRIEND_CODE).join("a", req("create", { name: "   " })))).toContain("Pick a name");
  });

  it("won't mix a quick rider into a friend room", () => {
    const r = room(FRIEND_CODE);
    r.join("a", req("create"));
    // Code shape guard fires first for a friend code; use a quick room with a friend intent instead
    const q = room(QUICK_CODE);
    q.join("a", req("quick", { expected: 3 }));
    expect(errorMessage(q.join("b", req("join")))).toContain("code isn't valid");
  });
});

describe("RoomState quick-play gather", () => {
  it("arms the gather on the first matched rider and starts once everyone arrived", () => {
    const r = room(QUICK_CODE);
    const first = r.join("a", req("quick", { expected: 2 }));
    expect(first.timers).toEqual([{ kind: "schedule", id: "gather", inMs: QUICK_GATHER_MS }]);
    expect(r.players.get("a")?.ready).toBe(true); // matchmade riders skip READY

    const second = r.join("b", req("quick", { expected: 2 }));
    expect(second.timers).toEqual([
      { kind: "cancel", id: "gather" },
      { kind: "schedule", id: "countdown", inMs: COUNTDOWN_MS },
    ]);
    expect(sent(second, "countdown_start")[0]?.msg.seed).toBe(2);
    expect(r.phase).toBe("countdown");
  });

  it("races with whoever made it when the gather runs out", () => {
    const r = room(QUICK_CODE);
    r.join("a", req("quick", { expected: 3 }));
    r.join("b", req("quick", { expected: 3 }));
    expect(r.phase).toBe("lobby");
    const fx = r.onTimer("gather", 5000);
    expect(sent(fx, "countdown_start")).toHaveLength(1);
    expect(r.quickGatherEnded).toBe(true);
  });

  it("re-queues a lone rider when the gather runs out", () => {
    const r = room(QUICK_CODE);
    r.join("a", req("quick", { expected: 2 }));
    const fx = r.onTimer("gather", 5000);
    expect(sent(fx, "match_failed")[0]).toMatchObject({ to: "all" });
    expect(r.phase).toBe("lobby");
  });

  it("re-queues a quick rider who arrives after the gather ended (9ef6710)", () => {
    // Lone rider timed out and is about to leave
    const r = room(QUICK_CODE);
    r.join("a", req("quick", { expected: 2 }));
    r.onTimer("gather", 5000);
    const late = r.join("b", req("quick", { expected: 2 }));
    expect(late.outbox).toEqual([{ to: "one", id: "b", msg: { type: "match_failed" } }]);
    expect(late.timers).toEqual([]);
    expect(r.hasPlayer("b")).toBe(false);

    // The race went ahead without them: still match_failed, not "already started"
    const q = room(QUICK_CODE);
    q.join("a", req("quick", { expected: 2 }));
    q.join("b", req("quick", { expected: 2 }));
    expect(q.phase).toBe("countdown");
    expect(sent(q.join("c", req("quick", { expected: 2 })), "match_failed")).toHaveLength(1);
  });

  it("keeps a matchmade code spent even after the room empties", () => {
    const r = room(QUICK_CODE);
    r.join("a", req("quick", { expected: 2 }));
    r.onTimer("gather", 5000);
    r.leave("a");
    expect(r.players.size).toBe(0);
    expect(sent(r.join("b", req("quick", { expected: 2 })), "match_failed")).toHaveLength(1);
  });
});

describe("RoomState countdown", () => {
  it("starts only when at least two players are all ready", () => {
    const r = room(FRIEND_CODE);
    r.join("a", req("create"));
    expect(sent(r.ready("a"), "countdown_start")).toHaveLength(0);
    r.join("b", req("join"));
    const fx = r.ready("b");
    expect(sent(fx, "player_ready")[0]).toMatchObject({ to: "all", msg: { playerId: "b" } });
    expect(fx.timers).toEqual([{ kind: "schedule", id: "countdown", inMs: COUNTDOWN_MS }]);
    expect(r.ready("b")).toEqual({ outbox: [], timers: [] }); // repeats are ignored
  });

  it("goes back to the lobby with everyone un-readied when a friend leaves mid-countdown", () => {
    const r = countdownRoom();
    const fx = r.leave("b");
    expect(fx.timers).toContainEqual({ kind: "cancel", id: "countdown" });
    expect(sent(fx, "player_left")[0]?.msg.playerId).toBe("b");
    expect(sent(fx, "countdown_cancelled")[0]?.msg.players).toEqual([
      expect.objectContaining({ id: "a", ready: false, alive: true }),
    ]);
    expect(r.phase).toBe("lobby");

    // The next joiner's READY must not start a race the first player never re-confirmed
    r.join("c", req("join"));
    expect(sent(r.ready("c"), "countdown_start")).toHaveLength(0);
    expect(sent(r.ready("a"), "countdown_start")).toHaveLength(1);
  });

  it("re-queues the remaining matchmade rider when the other drops mid-countdown", () => {
    const r = room(QUICK_CODE);
    r.join("a", req("quick", { expected: 2 }));
    r.join("b", req("quick", { expected: 2 }));
    const fx = r.disconnect("b");
    expect(sent(fx, "player_crashed")[0]?.msg.playerId).toBe("b");
    expect(sent(fx, "match_failed")).toHaveLength(1);
    expect(sent(fx, "countdown_cancelled")).toHaveLength(0);
    expect(r.phase).toBe("lobby");
  });

  it("starts the race and the silence check when the countdown ends", () => {
    const r = countdownRoom();
    const fx = r.onTimer("countdown", 1000);
    expect(sent(fx, "race_start")[0]).toMatchObject({ to: "all" });
    expect(fx.timers).toEqual([{ kind: "schedule", id: "staleCheck", inMs: STALE_CHECK_INTERVAL_MS }]);
  });
});

describe("RoomState race", () => {
  const snapshot = { t: 1000, h: 0, og: true, wr: 0, bt: 0, rl: 0, rc: 0, lt: 0, ba: 0, fd: 1, at: "NONE", tp: 0, s: 0 };

  it("relays a sanitised snapshot to the other players with the guarded score", () => {
    const r = racingRoom();
    const fx = r.playerUpdate("a", { ...snapshot, s: 20, evil: true }, 1500);
    const relayed = sent(fx, "ghost_update")[0];
    expect(relayed).toMatchObject({ to: "others", except: "a", msg: { playerId: "a" } });
    expect(relayed?.msg.snapshot).toEqual({ ...snapshot, s: 20 });
    expect(r.players.get("a")?.score).toBe(20);
    expect(r.playerUpdate("a", { ...snapshot, h: "high" }, 1600).outbox).toEqual([]);
  });

  it("finishes with rankings once everyone has crashed", () => {
    const r = racingRoom();
    const first = r.playerCrashed("a", 30, 2000);
    expect(sent(first, "player_crashed")[0]?.msg).toEqual({ type: "player_crashed", playerId: "a", score: 30 });
    expect(sent(first, "race_finished")).toHaveLength(0);

    const last = r.playerCrashed("b", 10, 2500);
    const rankings = sent(last, "race_finished")[0]?.msg.rankings;
    expect(rankings?.map((e) => [e.playerId, e.rank, e.score])).toEqual([["a", 1, 30], ["b", 2, 10]]);
    expect(last.timers).toContainEqual({ kind: "cancel", id: "staleCheck" });
    expect(r.phase).toBe("finished");
  });

  it("finishes when the last rider alive leaves or disconnects", () => {
    const left = racingRoom();
    left.playerCrashed("a", 30, 2000);
    expect(sent(left.leave("b"), "race_finished")).toHaveLength(1);

    const dropped = racingRoom();
    const fx = dropped.disconnect("a");
    expect(sent(fx, "player_crashed")[0]?.msg.playerId).toBe("a");
    expect(sent(fx, "player_left")[0]?.msg.playerId).toBe("a");
    expect(sent(fx, "race_finished")).toHaveLength(0); // b is still riding
  });

  it("counts out racers silent for STALE_PLAYER_MS and re-arms the check while racing", () => {
    const r = racingRoom();
    const early = r.onTimer("staleCheck", 1000 + STALE_CHECK_INTERVAL_MS);
    expect(early.outbox).toEqual([]);
    expect(early.timers).toEqual([{ kind: "schedule", id: "staleCheck", inMs: STALE_CHECK_INTERVAL_MS }]);

    r.playerUpdate("b", { ...snapshot, t: 2000 }, 1000 + STALE_PLAYER_MS - 500);
    const late = r.onTimer("staleCheck", 1000 + STALE_PLAYER_MS);
    expect(sent(late, "player_crashed").map((o) => o.msg.playerId)).toEqual(["a"]); // b just spoke
    expect(late.timers).toEqual([{ kind: "schedule", id: "staleCheck", inMs: STALE_CHECK_INTERVAL_MS }]);

    const done = r.onTimer("staleCheck", 1000 + 2 * STALE_PLAYER_MS);
    expect(sent(done, "player_crashed").map((o) => o.msg.playerId)).toEqual(["b"]);
    expect(sent(done, "race_finished")).toHaveLength(1);
    expect(done.timers).toEqual([{ kind: "cancel", id: "staleCheck" }]);
  });

  it("ignores snapshots and crash reports from racers already counted out", () => {
    const r = racingRoom();
    r.playerCrashed("a", 30, 2000);
    expect(r.playerUpdate("a", { ...snapshot, t: 3000 }, 3000).outbox).toEqual([]);
    expect(r.playerCrashed("a", 999, 3000).outbox).toEqual([]);
    expect(r.players.get("a")?.score).toBe(30);
  });
});

describe("RoomState rematch", () => {
  it("resets the room to a fresh lobby with the same players", () => {
    const r = racingRoom();
    r.playerCrashed("a", 30, 2000);
    r.playerCrashed("b", 10, 2500);
    const fx = r.rematch("a");
    expect(sent(fx, "room_reset")[0]?.msg.players).toEqual([
      expect.objectContaining({ id: "a", ready: false, alive: true, score: 0 }),
      expect.objectContaining({ id: "b", ready: false, alive: true, score: 0 }),
    ]);
    expect(r.phase).toBe("lobby");
    // A second Play Again (from the other player) changes nothing
    expect(r.rematch("b")).toEqual({ outbox: [], timers: [] });
  });

  it("does nothing outside the results screen", () => {
    expect(racingRoom().rematch("a")).toEqual({ outbox: [], timers: [] });
  });

  it("clears every timer when the last player leaves", () => {
    const r = racingRoom();
    r.leave("a");
    const fx = r.leave("b");
    expect(fx.timers).toEqual(expect.arrayContaining([
      { kind: "cancel", id: "countdown" },
      { kind: "cancel", id: "staleCheck" },
    ]));
    expect(r.phase).toBe("lobby");
    expect(r.players.size).toBe(0);
  });
});
