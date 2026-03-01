"use client";

import { useState, useRef, useCallback } from "react";
import type { PlayerInfo, RankingEntry, RoomPhase, ServerMessage, ClientMessage } from "@/game/multiplayer/types";
import { MultiplayerAdapter } from "@/game/multiplayer/MultiplayerAdapter";

type ConnectionState = "disconnected" | "connecting" | "connected";

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";

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

  const connect = useCallback((code: string, name: string, skinId: string) => {
    if (wsRef.current) return;

    setConnectionState("connecting");
    setRoomCode(code);
    setError(null);

    const protocol = PARTYKIT_HOST.startsWith("localhost") ? "ws" : "wss";
    const ws = new WebSocket(`${protocol}://${PARTYKIT_HOST}/party/${code}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionState("connected");
      const joinMsg: ClientMessage = { type: "join", name, skinId };
      ws.send(JSON.stringify(joinMsg));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ServerMessage;

      switch (msg.type) {
        case "room_joined": {
          setLocalPlayerId(msg.playerId);
          setPlayers(msg.players);
          setPhase(msg.phase);
          setSeed(msg.seed);
          setRoomCode(msg.roomCode);

          const newAdapter = new MultiplayerAdapter(ws, msg.playerId, msg.players, {
            onRemotePlayerCrashed: () => {},
            onRaceFinished: (r) => {
              setRankings(r);
              setPhase("finished");
            },
            onPlayersUpdate: (p) => setPlayers([...p]),
          });
          adapterRef.current = newAdapter;
          setAdapter(newAdapter);
          break;
        }
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
          adapterRef.current?.markRaceStart();
          break;
        case "ghost_update":
        case "player_crashed":
          adapterRef.current?.handleServerMessage(msg);
          break;
        case "race_finished":
          setRankings(msg.rankings);
          setPhase("finished");
          adapterRef.current?.handleServerMessage(msg);
          break;
        case "error":
          console.error("[Multiplayer] Server error:", msg.message);
          break;
      }
    };

    ws.onclose = () => {
      setConnectionState("disconnected");
      wsRef.current = null;
    };

    ws.onerror = () => {
      console.error("[Multiplayer] WebSocket error — is the PartyKit server running?");
      setError("Could not connect to multiplayer server. Make sure the PartyKit server is running (cd party && npx partykit dev).");
      wsRef.current = null;
      setConnectionState("disconnected");
      setRoomCode(null);
    };
  }, []);

  const createRoom = useCallback(
    (name: string, skinId: string) => {
      const code = generateRoomCode();
      connect(code, name, skinId);
    },
    [connect]
  );

  const joinRoom = useCallback(
    (code: string, name: string, skinId: string) => {
      connect(code.toUpperCase(), name, skinId);
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
    const ws = wsRef.current;
    if (ws) {
      if (ws.readyState === WebSocket.OPEN) {
        const msg: ClientMessage = { type: "leave" };
        ws.send(JSON.stringify(msg));
      }
      ws.close();
      wsRef.current = null;
    }
    adapterRef.current?.destroy();
    adapterRef.current = null;
    setAdapter(null);
    setConnectionState("disconnected");
    setRoomCode(null);
    setPlayers([]);
    setPhase("lobby");
    setSeed(0);
    setLocalPlayerId("");
    setRankings([]);
    setCountdownEndMs(null);
    setError(null);
  }, []);

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
    disconnect,
  };
}
