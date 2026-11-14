"use client";

/**
 * React side of a multiplayer room: owns the room WebSocket and the race adapter,
 * projects server messages onto room state through roomReducer, and composes
 * useMatchmaker for quick play. Everything here is socket plumbing — the state
 * transitions live in game/multiplayer/roomReducer.ts and the search flow in
 * useMatchmaker.ts.
 */
import { useState, useRef, useCallback, useEffect, useReducer } from "react";
import type { ClientMessage, JoinIntent, PlayerInfo, ServerMessage } from "@/game/multiplayer/protocol";
import { FRIEND_CODE_LENGTH, randomRoomCode } from "@/game/multiplayer/protocol";
import type { SkinId } from "@/game/types";
import { MultiplayerAdapter } from "@/game/multiplayer/MultiplayerAdapter";
import { INITIAL_ROOM_STATE, roomReducer } from "@/game/multiplayer/roomReducer";
import { parseServerMessage } from "@/game/multiplayer/parseServerMessage";
import { MULTIPLAYER_HOST, roomUrl } from "@/lib/multiplayerConfig";
import { useMatchmaker } from "./useMatchmaker";

export type { QuickPlayQueue } from "./useMatchmaker";

type ConnectionState = "disconnected" | "connecting" | "connected";

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
  const [room, dispatch] = useReducer(roomReducer, INITIAL_ROOM_STATE);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [adapter, setAdapter] = useState<MultiplayerAdapter | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const adapterRef = useRef<MultiplayerAdapter | null>(null);
  /** Mirrors room.raceFinished for the socket's onclose, which can't read React state. */
  const raceFinishedRef = useRef(false);

  const matchmaker = useMatchmaker(MULTIPLAYER_HOST, {
    // `connect` is declared below; the hook reads this closure only when a match arrives
    onMatched: (match) => connect(match.roomCode, match.name, match.skinId, "quick", match.expected),
    onError: setError,
  });

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

  const { cancel: cancelSearch, searchAgain } = matchmaker;

  const resetRoomState = useCallback(() => {
    raceFinishedRef.current = false;
    cancelSearch();
    setAdapter(null);
    setConnectionState("disconnected");
    dispatch({ type: "reset" });
  }, [cancelSearch]);

  // Leaving the page (back button, route change) must close the socket — otherwise the
  // server keeps this player "alive" and the race can never finish for everyone else.
  useEffect(() => () => releaseConnection(false), [releaseConnection]);

  const connect = useCallback((code: string, name: string, skinId: SkinId, intent: JoinIntent, expected?: number) => {
    if (wsRef.current) return;
    const host = MULTIPLAYER_HOST;
    if (!host) {
      // Build has no multiplayer server configured; entry points are hidden, but the URL still works
      setError("Multiplayer isn't available right now.");
      return;
    }

    let createRetries = intent === "create" ? MAX_CREATE_RETRIES : 0;

    /** Opens the socket for one room code; a taken code re-enters here with a fresh one. */
    const open = (roomCode: string) => {
      // roomCode is only set once the server confirms (room_joined) — setting it early
      // showed a lobby the server might still reject.
      setConnectionState("connecting");
      setError(null);

      const ws = new WebSocket(roomUrl(host, roomCode));
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
        const next = new MultiplayerAdapter(ws, myId, roster, {
          onPlayersUpdate: (players) => dispatch({ type: "players_updated", players }),
        });
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
        const msg = parseServerMessage<ServerMessage>(event.data);
        if (!msg) return;

        // State is a pure projection of the message; only side effects remain below
        dispatch(msg);
        switch (msg.type) {
          case "room_joined":
            joined = true;
            clearTimeout(joinTimer);
            myId = msg.playerId;
            cancelSearch(); // the quick-play waiting screen is done
            startAdapter(msg.players);
            break;
          case "match_failed":
            // A matched rider never showed up — quietly go back to searching
            releaseConnection(false);
            resetRoomState();
            searchAgain();
            break;
          case "room_reset":
          case "countdown_cancelled":
            startAdapter(msg.players);
            break;
          case "player_joined":
          case "player_left":
          case "ghost_update":
          case "player_crashed":
            adapterRef.current?.handleServerMessage(msg);
            break;
          case "race_finished":
            raceFinishedRef.current = true;
            break;
          case "error":
            if (!joined) {
              // Join rejected (no such room / race running / full) — back to create/join
              clearTimeout(joinTimer);
              releaseConnection(false);
              resetRoomState();
              if (msg.reason === "room_taken" && createRetries > 0) {
                createRetries--;
                open(randomRoomCode(FRIEND_CODE_LENGTH));
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
        console.error(`[Multiplayer] WebSocket error connecting to ${host} — in local dev, is \`cd party && npm run dev\` running?`);
      };
    };

    open(code);
  }, [releaseConnection, resetRoomState, cancelSearch, searchAgain]);

  const createRoom = useCallback(
    (name: string, skinId: SkinId) => {
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

  const { search } = matchmaker;

  /** Joins the quick-play queue; the matched room is joined automatically (see useMatchmaker). */
  const startQuickPlay = useCallback((name: string, skinId: SkinId) => {
    if (wsRef.current) return;
    if (search(name, skinId)) setError(null);
  }, [search]);

  /** Leaves the quick-play queue (back to create/join). */
  const cancelQuickPlay = cancelSearch;

  const setReady = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const msg: ClientMessage = { type: "ready" };
      ws.send(JSON.stringify(msg));
    }
  }, []);

  const disconnect = useCallback(() => {
    releaseConnection(true);
    resetRoomState();
    setError(null);
  }, [releaseConnection, resetRoomState]);

  /**
   * Friend rooms go back to the same lobby for another race with the same group.
   * Quick-play rooms search again instead — strangers rarely all stay for a rematch.
   */
  const playAgain = useCallback(() => {
    if (room.quickPlay) {
      disconnect();
      searchAgain();
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
    dispatch({ type: "rematch_requested" });
  }, [disconnect, searchAgain, room.quickPlay]);

  return {
    connectionState,
    roomCode: room.roomCode,
    players: room.players,
    phase: room.phase,
    seed: room.seed,
    localPlayerId: room.localPlayerId,
    rankings: room.rankings,
    adapter,
    error,
    quickPlay: room.quickPlay,
    queue: matchmaker.queue,
    createRoom,
    joinRoom,
    startQuickPlay,
    cancelQuickPlay,
    setReady,
    playAgain,
    disconnect,
  };
}
