/**
 * Client-side projection of server messages onto the room state a React page renders
 * (lobby roster, phase, seed, results). Pure, so the lobby → race → results flow can be
 * tested without sockets; useMultiplayerRoom feeds it every ServerMessage and a few local
 * events, and handles the side effects (sockets, adapter) separately.
 */
import type { PlayerInfo, RankingEntry, RoomPhase, ServerMessage } from "./protocol";

/** What the /multiplayer page needs to know about the room it is in. */
export interface RoomViewState {
  /** Set only once the server confirmed the join (room_joined). */
  roomCode: string | null;
  players: PlayerInfo[];
  phase: RoomPhase;
  seed: number;
  localPlayerId: string;
  rankings: RankingEntry[];
  /** Matchmade room: no code to share, and Play Again searches again instead of a rematch. */
  quickPlay: boolean;
  /** Results arrived, so the server's later idle close must not read as a dropped race. */
  raceFinished: boolean;
}

/** Local events alongside the server's, so the reducer owns every state change. */
export type RoomEvent =
  | ServerMessage
  /** The race adapter saw a score/crash change (it holds the live roster during a race). */
  | { type: "players_updated"; players: PlayerInfo[] }
  /** Play Again in a friend room: back to the lobby locally while the server answers with room_reset. */
  | { type: "rematch_requested" }
  /** Connection released: back to the create/join screen. */
  | { type: "reset" };

export const INITIAL_ROOM_STATE: RoomViewState = {
  roomCode: null,
  players: [],
  phase: "lobby",
  seed: 0,
  localPlayerId: "",
  rankings: [],
  quickPlay: false,
  raceFinished: false,
};

/**
 * Applies one event. Messages that only concern the race adapter (ghost_update,
 * player_crashed) or need a side effect (match_failed, error) leave the state untouched,
 * returning the same reference so React skips the render.
 * @example
 * roomReducer(INITIAL_ROOM_STATE, { type: "race_start" }).phase // "racing"
 */
export function roomReducer(state: RoomViewState, event: RoomEvent): RoomViewState {
  switch (event.type) {
    case "room_joined":
      return {
        ...state,
        roomCode: event.roomCode,
        localPlayerId: event.playerId,
        players: event.players,
        phase: event.phase,
        seed: event.seed,
        quickPlay: event.quickPlay,
        raceFinished: false,
      };
    case "room_reset":
      // Someone chose Play Again. Players still on results stay there (phase "finished"
      // locally) until they click Play Again themselves.
      return { ...state, players: event.players };
    case "player_joined":
      return { ...state, players: [...state.players, event.player] };
    case "player_left":
      return { ...state, players: state.players.filter((p) => p.id !== event.playerId) };
    case "player_ready":
      return {
        ...state,
        players: state.players.map((p) => (p.id === event.playerId ? { ...p, ready: true } : p)),
      };
    case "players_updated":
      return { ...state, players: event.players };
    case "countdown_cancelled":
      // Someone left mid-countdown and too few riders remain
      return { ...state, players: event.players, phase: "lobby" };
    case "countdown_start":
      return { ...state, phase: "countdown", seed: event.seed };
    case "race_start":
      return { ...state, phase: "racing" };
    case "race_finished":
      return { ...state, rankings: event.rankings, phase: "finished", raceFinished: true };
    case "rematch_requested":
      return { ...state, rankings: [], phase: "lobby", raceFinished: false };
    case "reset":
      return INITIAL_ROOM_STATE;
    case "ghost_update":
    case "player_crashed":
    case "match_failed":
    case "error":
      return state;
  }
}
