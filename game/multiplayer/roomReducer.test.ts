import { describe, expect, it } from "vitest";
import { INITIAL_ROOM_STATE, roomReducer, type RoomViewState } from "./roomReducer";
import type { PlayerInfo } from "./protocol";
import { TrickType } from "../types";

function player(id: string, overrides: Partial<PlayerInfo> = {}): PlayerInfo {
  return { id, name: id.toUpperCase(), skinId: "default", ready: false, alive: true, score: 0, ...overrides };
}

const joined: RoomViewState = roomReducer(INITIAL_ROOM_STATE, {
  type: "room_joined",
  roomCode: "ABCD",
  playerId: "me",
  players: [player("host"), player("me")],
  phase: "lobby",
  seed: 7,
  quickPlay: false,
});

describe("roomReducer", () => {
  it("takes the room over from room_joined", () => {
    expect(joined).toEqual({
      ...INITIAL_ROOM_STATE,
      roomCode: "ABCD",
      localPlayerId: "me",
      players: [player("host"), player("me")],
      seed: 7,
    });
  });

  it("keeps the roster in step with joins, leaves and readies", () => {
    let s = roomReducer(joined, { type: "player_joined", player: player("c") });
    expect(s.players.map((p) => p.id)).toEqual(["host", "me", "c"]);
    s = roomReducer(s, { type: "player_ready", playerId: "c" });
    expect(s.players.find((p) => p.id === "c")?.ready).toBe(true);
    expect(s.players.find((p) => p.id === "me")?.ready).toBe(false);
    s = roomReducer(s, { type: "player_left", playerId: "host" });
    expect(s.players.map((p) => p.id)).toEqual(["me", "c"]);
    s = roomReducer(s, { type: "players_updated", players: [player("me", { score: 50 })] });
    expect(s.players).toEqual([player("me", { score: 50 })]);
  });

  it("walks lobby → countdown → racing → finished", () => {
    let s = roomReducer(joined, { type: "countdown_start", seed: 99 });
    expect(s).toMatchObject({ phase: "countdown", seed: 99 });
    s = roomReducer(s, { type: "race_start" });
    expect(s.phase).toBe("racing");
    const rankings = [{ playerId: "me", name: "ME", skinId: "default" as const, score: 10, rank: 1 }];
    s = roomReducer(s, { type: "race_finished", rankings });
    expect(s).toMatchObject({ phase: "finished", rankings, raceFinished: true });
  });

  it("returns to the lobby on a cancelled countdown with the server's roster", () => {
    const counting = roomReducer(joined, { type: "countdown_start", seed: 1 });
    const s = roomReducer(counting, { type: "countdown_cancelled", players: [player("me")] });
    expect(s).toMatchObject({ phase: "lobby", players: [player("me")], seed: 1 });
  });

  it("handles Play Again locally, then takes the reset roster from the server", () => {
    const finished = roomReducer(joined, { type: "race_finished", rankings: [] });
    const s = roomReducer(finished, { type: "rematch_requested" });
    expect(s).toMatchObject({ phase: "lobby", rankings: [], raceFinished: false });
    const reset = roomReducer(s, { type: "room_reset", players: [player("host"), player("me")] });
    expect(reset.players).toHaveLength(2);
    // A player still on results only sees the roster change, not their phase
    expect(roomReducer(finished, { type: "room_reset", players: [] }).phase).toBe("finished");
  });

  it("goes back to the initial state on reset", () => {
    expect(roomReducer(joined, { type: "reset" })).toBe(INITIAL_ROOM_STATE);
  });

  it("leaves the state untouched for adapter-only and side-effect messages", () => {
    const snapshot = { t: 0, h: 0, og: true, wr: 0, bt: 0, rl: 0, rc: 0, lt: 0, ba: 0, fd: 1, at: TrickType.NONE, tp: 0, s: 0 };
    expect(roomReducer(joined, { type: "ghost_update", playerId: "host", snapshot })).toBe(joined);
    expect(roomReducer(joined, { type: "player_crashed", playerId: "host", score: 1 })).toBe(joined);
    expect(roomReducer(joined, { type: "match_failed" })).toBe(joined);
    expect(roomReducer(joined, { type: "error", message: "nope" })).toBe(joined);
  });
});
