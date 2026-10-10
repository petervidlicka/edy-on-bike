"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { PlayerInfo, RankingEntry, RoomPhase, ServerMessage, ClientMessage } from "@/game/multiplayer/types";
import { MultiplayerAdapter } from "@/game/multiplayer/MultiplayerAdapter";
import { PARTYKIT_HOST, partyKitUrl } from "@/lib/multiplayerConfig";

type ConnectionState = "disconnected" | "connecting" | "connected";


function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 to avoid confusion
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function useMultiplayerRoom() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [phase, setPhase] = useState<RoomPhase>("lobby");
  const [seed, setSeed] = useState<number>(0);
  const [localPlayerId, setLocalPlayerId] = useState<string>("");
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [adapter, setAdapter] = useState<MultiplayerAdapter | null>(null);
  const [countdownEndMs, setCountdownEndMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
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

  const resetRoomState = useCallback(() => {
    raceFinishedRef.current = false;
    setAdapter(null);
    setConnectionState("disconnected");
    setRoomCode(null);
    setPlayers([]);
    setPhase("lobby");
    setSeed(0);
    setLocalPlayerId("");
    setRankings([]);
    setCountdownEndMs(null);
  }, []);

  // Leaving the page (back button, route change) must close the socket — otherwise the
  // server keeps this player "alive" and the race can never finish for everyone else.
  useEffect(() => () => releaseConnection(false), [releaseConnection]);

  const connect = useCallback((code: string, name: string, skinId: string, intent: "create" | "join") => {
    if (wsRef.current) return;
    if (!PARTYKIT_HOST) {
      // Build has no multiplayer server configured; entry points are hidden, but the URL still works
      setError("Multiplayer isn't available right now.");
      return;
    }

    // roomCode is only set once the server confirms (room_joined) — setting it early
    // showed a lobby the server might still reject.
    setConnectionState("connecting");
    setError(null);

    const ws = new WebSocket(partyKitUrl(PARTYKIT_HOST, code));
    wsRef.current = ws;

    let opened = false;
    let joined = false;
    let myId = "";

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
      const joinMsg: ClientMessage = { type: "join", name, skinId, intent };
      ws.send(JSON.stringify(joinMsg));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ServerMessage;

      switch (msg.type) {
        case "room_joined": {
          joined = true;
          myId = msg.playerId;
          setLocalPlayerId(msg.playerId);
          setPlayers(msg.players);
          setPhase(msg.phase);
          setSeed(msg.seed);
          setRoomCode(msg.roomCode);
          startAdapter(msg.players);
          break;
        }
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
        case "countdown_start":
          setPhase("countdown");
          setSeed(msg.seed);
          setCountdownEndMs(msg.startAtMs);
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
          adapterRef.current?.handleServerMessage(msg);
          break;
        case "error":
          if (!joined) {
            // Join rejected (no such room / race running / full) — back to create/join
            releaseConnection(false);
            resetRoomState();
          }
          setError(msg.message);
          break;
      }
    };

    ws.onclose = () => {
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
      console.error(`[Multiplayer] WebSocket error connecting to ${PARTYKIT_HOST} — in local dev, is \`cd party && npx partykit dev\` running?`);
    };
  }, [releaseConnection, resetRoomState]);

  const createRoom = useCallback(
    (name: string, skinId: string) => {
      const code = generateRoomCode();
      connect(code, name, skinId, "create");
    },
    [connect]
  );

  const joinRoom = useCallback(
    (code: string, name: string, skinId: string) => {
      connect(code.toUpperCase(), name, skinId, "join");
    },
    [connect]
  );

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

  /** Back to this room's lobby for another race with the same group. */
  const playAgain = useCallback(() => {
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
  }, [disconnect]);

  return {
    connectionState,
    roomCode,
    players,
    phase,
    seed,
    localPlayerId,
    rankings,
    adapter,
    countdownEndMs,
    error,
    createRoom,
    joinRoom,
    setReady,
    playAgain,
    disconnect,
  };
}
