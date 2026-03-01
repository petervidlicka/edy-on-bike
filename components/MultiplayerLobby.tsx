"use client";

import { useState, useCallback } from "react";
import { PlayerInfo, RoomPhase } from "@/game/multiplayer/types";
import { SkinId } from "@/game/types";
import SkinPicker from "@/components/SkinPicker";

interface MultiplayerLobbyProps {
  roomCode: string | null;
  players: PlayerInfo[];
  phase: RoomPhase;
  error?: string | null;
  onCreateRoom: (name: string, skinId: string) => void;
  onJoinRoom: (code: string, name: string, skinId: string) => void;
  onReady: () => void;
  onLeave: () => void;
}

const glassBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.22)",
  backdropFilter: "blur(24px) saturate(200%)",
  WebkitBackdropFilter: "blur(24px) saturate(200%)",
  border: "1.5px solid rgba(255,255,255,0.55)",
  borderRadius: "18px",
  padding: "0.65rem 2.25rem",
  boxShadow:
    "0 2px 20px rgba(0,0,0,0.1), inset 0 1.5px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.04)",
  color: "#1e293b",
  fontSize: "1rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textAlign: "center",
  cursor: "pointer",
  fontFamily: "var(--font-nunito), Arial, sans-serif",
};

const inputStyle: React.CSSProperties = {
  padding: "0.6rem 1rem",
  fontSize: "1rem",
  borderRadius: "12px",
  border: "1.5px solid rgba(255,255,255,0.55)",
  background: "rgba(255,255,255,0.35)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  outline: "none",
  fontFamily: "var(--font-nunito), Arial, sans-serif",
  fontWeight: 600,
  color: "#1e293b",
  textAlign: "center",
};

export default function MultiplayerLobby({
  roomCode,
  players,
  phase,
  error,
  onCreateRoom,
  onJoinRoom,
  onReady,
  onLeave,
}: MultiplayerLobbyProps) {
  const [name, setName] = useState("");
  const [selectedSkinId, setSelectedSkinId] = useState<SkinId>("default");
  const [joinCode, setJoinCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);

  const localPlayer = players.find(
    (p) => p.name === name || players.length === 1
  );
  const isReady = localPlayer?.ready ?? false;

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;
    onCreateRoom(name.trim(), selectedSkinId);
  }, [name, selectedSkinId, onCreateRoom]);

  const handleJoin = useCallback(() => {
    if (!name.trim() || joinCode.length !== 4) return;
    onJoinRoom(joinCode.toUpperCase(), name.trim(), selectedSkinId);
  }, [name, joinCode, selectedSkinId, onJoinRoom]);

  // --- Lobby view (has room code) ---
  if (roomCode) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "var(--font-nunito), Arial, sans-serif",
          padding: "1rem",
        }}
      >
        <h2
          style={{
            color: "#27435E",
            fontSize: "1.8rem",
            fontFamily: "var(--font-fredoka), sans-serif",
            fontWeight: 600,
            margin: 0,
            letterSpacing: "0.04em",
            textShadow: "0 2px 6px rgba(255,255,255,0.4)",
          }}
        >
          Multiplayer Lobby
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <span
            style={{
              color: "#334155",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            Share this code!
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "2.8rem",
              fontWeight: 800,
              color: "#27435E",
              letterSpacing: "0.2em",
              textShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            {roomCode}
          </span>
        </div>

        {/* Player list */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
            width: "100%",
            maxWidth: "320px",
          }}
        >
          {players.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.5rem 1rem",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.22)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.4)",
              }}
            >
              <span
                style={{
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                }}
              >
                {p.name}
              </span>
              <span
                style={{
                  fontSize: "1.1rem",
                  color: p.ready ? "#22c55e" : "#94a3b8",
                }}
              >
                {p.ready ? "\u2713" : "\u2014"}
              </span>
            </div>
          ))}
        </div>

        <span
          style={{
            color: "#64748b",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {players.length < 2
            ? "Waiting for players..."
            : "Ready up!"}
        </span>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button
            onClick={onReady}
            disabled={isReady}
            style={{
              ...glassBtn,
              opacity: isReady ? 0.6 : 1,
              cursor: isReady ? "default" : "pointer",
            }}
          >
            {isReady ? "WAITING..." : "READY"}
          </button>
          <button onClick={onLeave} style={glassBtn}>
            LEAVE
          </button>
        </div>
      </div>
    );
  }

  // --- Create / Join view ---
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        fontFamily: "var(--font-nunito), Arial, sans-serif",
        padding: "1rem",
      }}
    >
      <h2
        style={{
          color: "#27435E",
          fontSize: "2.2rem",
          fontFamily: "var(--font-fredoka), sans-serif",
          fontWeight: 600,
          margin: 0,
          letterSpacing: "0.04em",
          textShadow: "0 2px 6px rgba(255,255,255,0.4)",
        }}
      >
        Multiplayer
      </h2>

      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={16}
        style={inputStyle}
      />

      <SkinPicker
        selectedSkinId={selectedSkinId}
        bestScore={9999}
        cheatUnlocked={true}
        onSelectSkin={setSelectedSkinId}
      />

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginTop: "0.5rem",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          style={{
            ...glassBtn,
            opacity: name.trim() ? 1 : 0.5,
            cursor: name.trim() ? "pointer" : "default",
          }}
        >
          CREATE ROOM
        </button>
        <button
          onClick={() => setShowJoinInput(true)}
          disabled={!name.trim()}
          style={{
            ...glassBtn,
            opacity: name.trim() ? 1 : 0.5,
            cursor: name.trim() ? "pointer" : "default",
          }}
        >
          JOIN ROOM
        </button>
      </div>

      {error && (
        <div
          style={{
            color: "#dc2626",
            fontSize: "0.85rem",
            fontWeight: 600,
            background: "rgba(220,38,38,0.1)",
            border: "1px solid rgba(220,38,38,0.3)",
            borderRadius: "12px",
            padding: "0.6rem 1.2rem",
            maxWidth: "340px",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      {showJoinInput && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "0.25rem",
          }}
        >
          <input
            type="text"
            placeholder="4-char code"
            value={joinCode}
            onChange={(e) =>
              setJoinCode(e.target.value.toUpperCase().slice(0, 4))
            }
            maxLength={4}
            style={{
              ...inputStyle,
              fontFamily: "monospace",
              fontSize: "1.4rem",
              letterSpacing: "0.2em",
              width: "8rem",
            }}
          />
          <button
            onClick={handleJoin}
            disabled={joinCode.length !== 4}
            style={{
              ...glassBtn,
              opacity: joinCode.length === 4 ? 1 : 0.5,
              cursor: joinCode.length === 4 ? "pointer" : "default",
              fontSize: "0.9rem",
              padding: "0.5rem 1.5rem",
            }}
          >
            JOIN
          </button>
        </div>
      )}
    </div>
  );
}
