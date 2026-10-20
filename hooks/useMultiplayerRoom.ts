"use client";

/**
 * React side of a multiplayer room: owns the WebSocket, turns server messages
 * into lobby/race/results state, and creates a MultiplayerAdapter per race.
 * Quick play adds a second, short-lived socket to the matchmaker, which hands
 * back a room code to join.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import type {
  PlayerInfo, RankingEntry, RoomPhase, ServerMessage, ClientMessage,
  MatchmakerClientMessage, MatchmakerServerMessage,
} from "@/game/multiplayer/protocol";
import { FRIEND_CODE_LENGTH, randomRoomCode } from "@/game/multiplayer/protocol";
import type { SkinId } from "@/game/types";
import { MultiplayerAdapter } from "@/game/multiplayer/MultiplayerAdapter";
import { MULTIPLAYER_HOST, matchmakerUrl, roomUrl } from "@/lib/multiplayerConfig";

type ConnectionState = "disconnected" | "connecting" | "connected";

/** Where a quick-play search stands, for the waiting screen. */
export interface QuickPlayQueue {
  /** Riders in the queue, including this one. */
  waiting: number;
  /** Local Date.now() when the current wait ends, or null while nothing is counting down. */
  deadlineAt: number | null;
  /** The wait ran out with nobody else around — time to offer alternatives. */
  lonely: boolean;
  /** A room was assigned; joining it now. */
  matched: boolean;
}

/** Last name/skin used for quick play, so a failed match or Play Again can re-queue without asking. */
interface QuickPlayParams {
  name: string;
  skinId: SkinId;
}

/**
 * Decodes one socket frame. A malformed frame (bad deploy, proxy noise) is
 * logged and dropped rather than throwing inside onmessage and wedging the room.
 */
function parseServerMessage<M extends { type: string } = ServerMessage>(data: unknown): M | null {
  if (typeof data !== "string") {
    console.error("[Multiplayer] Ignoring non-text message from server");
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(data);
    if (typeof parsed === "object" && parsed !== null && "type" in parsed) {
      return parsed as M;
    }
    console.error("[Multiplayer] Ignoring server message without a type:", data);
  } catch (err) {
    console.error("[Multiplayer] Ignoring malformed server message:", err);
  }
  return null;
}

/** How long to wait for the server to accept a join before giving up on the room. */
const JOIN_TIMEOUT_MS = 10_000;

/** New codes to try when a freshly generated room code turns out to be in use. */
const MAX_CREATE_RETRIES = 3;

/**
 * Connection and room state for the /multiplayer page. The socket closes on
 * unmount so leaving the page mid-race counts as a crash for everyone else.
 * @example
 * const { phase, players, createRoom, joinRoom, setReady, playAgain, disconnect } = useMultiplayerRoom();
 */
export function useMultiplayerRoom() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [phase, setPhase] = useState<RoomPhase>("lobby");
  const [seed, setSeed] = useState<number>(0);
  const [localPlayerId, setLocalPlayerId] = useState<string>("");
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [adapter, setAdapter] = useState<MultiplayerAdapter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quickPlay, setQuickPlay] = useState(false);
  const [queue, setQueue] = useState<QuickPlayQueue | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  /** Matchmaker socket while searching; cleared before an intentional close, like wsRef. */
  const matchmakerRef = useRef<WebSocket | null>(null);
  const quickParamsRef = useRef<QuickPlayParams | null>(null);
  /** startQuickPlay, reachable from connect()'s handlers without a circular useCallback dependency. */
  const requeueRef = useRef<() => void>(() => {});
  /** Retries left for createRoom when the server reports the generated code as taken. */
  const createRetriesRef = useRef(0);
  /** Opens a room on a fresh code; set below, since connect() can't depend on itself. */
  const retryCreateRef = useRef<(name: string, skinId: SkinId) => void>(() => {});
  const adapterRef = useRef<MultiplayerAdapter | null>(null);
  /** Set once results arrive, so the server's later idle close doesn't read as a dropped race. */
  const raceFinishedRef = useRef(false);

  /** Closes the socket and adapter. wsRef is cleared first so onclose knows it was intentional. */
  const releaseConnection = useCallback((sendLeave: boolean) => {
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) {
      if (sendLeave && ws.readyState === WebSocket.OPEN) {
        const msg: ClientMessage = { type: "leave" };
        ws.send(JSON.stringify(msg));
      }
      ws.close();
    }
    adapterRef.current?.destroy();
    adapterRef.current = null;
  }, []);

  const closeMatchmaker = useCallback(() => {
    const mm = matchmakerRef.current;
    matchmakerRef.current = null;
    mm?.close();
  }, []);

  const resetRoomState = useCallback(() => {
    raceFinishedRef.current = false;
    setQuickPlay(false);
    setQueue(null);
    setAdapter(null);
    setConnectionState("disconnected");
    setRoomCode(null);
    setPlayers([]);
    setPhase("lobby");
    setSeed(0);
    setLocalPlayerId("");
    setRankings([]);
  }, []);

  // Leaving the page (back button, route change) must close the socket — otherwise the
  // server keeps this player "alive" and the race can never finish for everyone else.
  useEffect(() => () => {
    releaseConnection(false);
    closeMatchmaker();
  }, [releaseConnection, closeMatchmaker]);

  const connect = useCallback((code: string, name: string, skinId: SkinId, intent: "create" | "join" | "quick", expected?: number) => {
    if (wsRef.current) return;
    if (!MULTIPLAYER_HOST) {
      // Build has no multiplayer server configured; entry points are hidden, but the URL still works
      setError("Multiplayer isn't available right now.");
      return;
    }

    // roomCode is only set once the server confirms (room_joined) — setting it early
    // showed a lobby the server might still reject.
    setConnectionState("connecting");
    setError(null);

    const ws = new WebSocket(roomUrl(MULTIPLAYER_HOST, code));
    wsRef.current = ws;

    let opened = false;
    let joined = false;
    let myId = "";

    // The socket can open and then never get an answer (server stuck, proxy dropping frames)
    const joinTimer = setTimeout(() => {
      if (wsRef.current !== ws || joined) return;
      releaseConnection(false);
      resetRoomState();
      setError("The multiplayer server didn't respond. Check your connection and try again.");
    }, JOIN_TIMEOUT_MS);

    /** One adapter per race: it accumulates crash/score state, so a rematch needs a fresh one. */
    const startAdapter = (roster: PlayerInfo[]) => {
      adapterRef.current?.destroy();
      const next = new MultiplayerAdapter(ws, myId, roster, { onPlayersUpdate: setPlayers });
      adapterRef.current = next;
      setAdapter(next);
    };
    ws.onopen = () => {
      opened = true;
      setConnectionState("connected");
      const joinMsg: ClientMessage = { type: "join", name, skinId, intent, expected };
      ws.send(JSON.stringify(joinMsg));
    };

    ws.onmessage = (event) => {
      const msg = parseServerMessage(event.data);
      if (!msg) return;

      switch (msg.type) {
        case "room_joined": {
          joined = true;
          clearTimeout(joinTimer);
          myId = msg.playerId;
          setLocalPlayerId(msg.playerId);
          setPlayers(msg.players);
          setPhase(msg.phase);
          setSeed(msg.seed);
          setRoomCode(msg.roomCode);
          setQuickPlay(msg.quickPlay);
          setQueue(null);
          startAdapter(msg.players);
          break;
        }
        case "match_failed":
          // A matched rider never showed up — quietly go back to searching
          releaseConnection(false);
          resetRoomState();
          requeueRef.current();
          break;
        case "room_reset":
          // Someone chose Play Again. Players still on results stay there (phase
          // "finished" locally) until they click Play Again themselves.
          setPlayers(msg.players);
          startAdapter(msg.players);
          break;
        case "player_joined":
          setPlayers((prev) => [...prev, msg.player]);
          adapterRef.current?.handleServerMessage(msg);
          break;
        case "player_left":
          setPlayers((prev) => prev.filter((p) => p.id !== msg.playerId));
          adapterRef.current?.handleServerMessage(msg);
          break;
        case "player_ready":
          setPlayers((prev) =>
            prev.map((p) => (p.id === msg.playerId ? { ...p, ready: true } : p))
          );
          break;
        case "countdown_cancelled":
          // Someone left mid-countdown and too few riders remain
          setPlayers(msg.players);
          startAdapter(msg.players);
          setPhase("lobby");
          break;
        case "countdown_start":
          setPhase("countdown");
          setSeed(msg.seed);
          break;
        case "race_start":
          setPhase("racing");
          break;
        case "ghost_update":
        case "player_crashed":
          adapterRef.current?.handleServerMessage(msg);
          break;
        case "race_finished":
          raceFinishedRef.current = true;
          setRankings(msg.rankings);
          setPhase("finished");
          break;
        case "error":
          if (!joined) {
            // Join rejected (no such room / race running / full) — back to create/join
            clearTimeout(joinTimer);
            releaseConnection(false);
            resetRoomState();
            if (msg.reason === "room_taken" && intent === "create" && createRetriesRef.current > 0) {
              createRetriesRef.current--;
              retryCreateRef.current(name, skinId);
              break;
            }
          }
          setError(msg.message);
          break;
      }
    };

    ws.onclose = () => {
      clearTimeout(joinTimer);
      // disconnect()/unmount clear wsRef before closing; anything else is a dropped connection
      if (wsRef.current !== ws) return;
      if (raceFinishedRef.current) {
        // Server idles out finished rooms; keep the results on screen
        wsRef.current = null;
        setConnectionState("disconnected");
        return;
      }
      releaseConnection(false);
      resetRoomState();
      setError(
        opened
          ? "Lost connection to the room. Create or join a new one to keep playing."
          : "Couldn't reach the multiplayer server. Check your connection and try again."
      );
    };

    // Every error is followed by a close event, which does the cleanup above
    ws.onerror = () => {
      console.error(`[Multiplayer] WebSocket error connecting to ${MULTIPLAYER_HOST} — in local dev, is \`cd party && npm run dev\` running?`);
    };
  }, [releaseConnection, resetRoomState]);

  const createRoom = useCallback(
    (name: string, skinId: SkinId) => {
      createRetriesRef.current = MAX_CREATE_RETRIES;
      connect(randomRoomCode(FRIEND_CODE_LENGTH), name, skinId, "create");
    },
    [connect]
  );

  const joinRoom = useCallback(
    (code: string, name: string, skinId: SkinId) => {
      connect(code.toUpperCase(), name, skinId, "join");
    },
    [connect]
  );

  /**
   * Joins the quick-play queue. The matchmaker answers with a room code once 2–4 riders
   * are grouped (see QUICK_PLAY_WAIT_MS), and the race in that room starts on its own.
   */
  const startQuickPlay = useCallback((name: string, skinId: SkinId) => {
    if (wsRef.current || matchmakerRef.current) return;
    if (!MULTIPLAYER_HOST) {
      setError("Multiplayer isn't available right now.");
      return;
    }
    quickParamsRef.current = { name, skinId };
    setError(null);
    setQueue({ waiting: 1, deadlineAt: null, lonely: false, matched: false });

    const mm = new WebSocket(matchmakerUrl(MULTIPLAYER_HOST));
    matchmakerRef.current = mm;
    let opened = false;

    mm.onopen = () => {
      opened = true;
      const msg: MatchmakerClientMessage = { type: "queue" };
      mm.send(JSON.stringify(msg));
    };

    mm.onmessage = (event) => {
      const msg = parseServerMessage<MatchmakerServerMessage>(event.data);
      if (!msg) return;
      switch (msg.type) {
        case "queue_status":
          setQueue((prev) => prev && {
            ...prev,
            waiting: msg.waiting,
            deadlineAt: msg.msLeft === null ? null : Date.now() + msg.msLeft,
          });
          break;
        case "queue_lonely":
          setQueue((prev) => prev && { ...prev, lonely: true });
          break;
        case "matched":
          closeMatchmaker();
          setQueue((prev) => prev && { ...prev, matched: true, deadlineAt: null });
          connect(msg.roomCode, name, skinId, "quick", msg.expected);
          break;
      }
    };

    mm.onclose = () => {
      if (matchmakerRef.current !== mm) return; // cancelled or matched
      matchmakerRef.current = null;
      setQueue(null);
      setError(
        opened
          ? "Lost connection while finding riders. Try Quick Play again."
          : "Couldn't reach the multiplayer server. Check your connection and try again."
      );
    };

    mm.onerror = () => {
      console.error(`[Multiplayer] WebSocket error connecting to the matchmaker on ${MULTIPLAYER_HOST}`);
    };
  }, [connect, closeMatchmaker]);

  useEffect(() => {
    retryCreateRef.current = (name, skinId) => {
      connect(randomRoomCode(FRIEND_CODE_LENGTH), name, skinId, "create");
    };
  }, [connect]);

  useEffect(() => {
    requeueRef.current = () => {
      const params = quickParamsRef.current;
      if (params) startQuickPlay(params.name, params.skinId);
    };
  }, [startQuickPlay]);

  /** Leaves the quick-play queue (back to create/join). */
  const cancelQuickPlay = useCallback(() => {
    closeMatchmaker();
    setQueue(null);
  }, [closeMatchmaker]);

  const setReady = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const msg: ClientMessage = { type: "ready" };
      ws.send(JSON.stringify(msg));
    }
  }, []);

  const disconnect = useCallback(() => {
    releaseConnection(true);
    closeMatchmaker();
    resetRoomState();
    setError(null);
  }, [releaseConnection, closeMatchmaker, resetRoomState]);

  /**
   * Friend rooms go back to the same lobby for another race with the same group.
   * Quick-play rooms search again instead — strangers rarely all stay for a rematch.
   */
  const playAgain = useCallback(() => {
    if (quickPlay) {
      disconnect();
      requeueRef.current();
      return;
    }
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      // Room was idled out while on the results screen — start fresh instead
      disconnect();
      return;
    }
    const msg: ClientMessage = { type: "rematch" };
    ws.send(JSON.stringify(msg));
    raceFinishedRef.current = false;
    setRankings([]);
    setPhase("lobby");
  }, [disconnect, quickPlay]);

  return {
    connectionState,
    roomCode,
    players,
    phase,
    seed,
    localPlayerId,
    rankings,
    adapter,
    error,
    quickPlay,
    queue,
    createRoom,
    joinRoom,
    startQuickPlay,
    cancelQuickPlay,
    setReady,
    playAgain,
    disconnect,
  };
}
