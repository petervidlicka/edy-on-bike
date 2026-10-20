"use client";

/**
 * Multiplayer lobby: create/join a room by code, pick a skin (same unlocks as
 * single-player), then wait for everyone to ready up.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { MAX_NAME_LENGTH } from "@/game/multiplayer/protocol";
import type { PlayerInfo } from "@/game/multiplayer/protocol";
import { SkinId } from "@/game/types";
import SkinPicker from "@/components/SkinPicker";
import { useSavedSkinState } from "@/hooks/useSavedSkinState";
import { useSavedPlayerName } from "@/hooks/useSavedPlayerName";
import { savePlayerName } from "@/game/storage";
import { getSkinById } from "@/game/skins";
import { drawSkinPreview } from "@/game/rendering";
import { GlassPanel } from "./ui/GlassPanel";
import { ScreenTitle } from "./ui/ScreenTitle";
import { GlassButton } from "./ui/GlassButton";
import { badge, color, font, input, radius, text } from "./ui/tokens";

interface MultiplayerLobbyProps {
  roomCode: string | null;
  /** Server-assigned id for this client — names aren't unique, so never match on them. */
  localPlayerId: string;
  players: PlayerInfo[];
  error?: string | null;
  /** Waiting for the server to accept a create/join — buttons stay disabled until it answers. */
  connecting?: boolean;
  onCreateRoom: (name: string, skinId: SkinId) => void;
  onJoinRoom: (code: string, name: string, skinId: SkinId) => void;
  onReady: () => void;
  onLeave: () => void;
}

/** Lays out a labelled field: caps label above its control. */
const fieldStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, minWidth: 0 };

/** Small bike preview next to each rider in the room list. */
function RiderAvatar({ skinId }: { skinId: SkinId }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawSkinPreview(ctx, getSkinById(skinId), 72, 79);
  }, [skinId]);
  return <canvas ref={canvasRef} width={72} height={79} aria-hidden="true" style={{ width: 36, height: 40, imageRendering: "pixelated" }} />;
}

/**
 * Shows create/join until the server confirms a room, then the room's rider
 * list with Ready / Leave.
 */
export default function MultiplayerLobby({
  roomCode,
  localPlayerId,
  players,
  error,
  connecting = false,
  onCreateRoom,
  onJoinRoom,
  onReady,
  onLeave,
}: MultiplayerLobbyProps) {
  // Prefill with the last-used name (leaderboard or a previous race) until the player types,
  // so it survives returning from a race or a dropped connection
  const savedName = useSavedPlayerName();
  const [typedName, setTypedName] = useState<string | null>(null);
  const name = typedName ?? savedName.slice(0, MAX_NAME_LENGTH);
  // Same unlocks as single-player (best score + cheat code from this browser), so
  // multiplayer isn't a back door to skins the player hasn't earned
  const [skinState, handleSelectSkin] = useSavedSkinState();
  const selectedSkinId: SkinId = skinState.selectedSkinId;
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  const localPlayer = players.find((p) => p.id === localPlayerId);
  const isReady = localPlayer?.ready ?? false;

  const canStart = !!name.trim() && !connecting;
  const canJoin = canStart && joinCode.length === 4;

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;
    savePlayerName(name.trim());
    onCreateRoom(name.trim(), selectedSkinId);
  }, [name, selectedSkinId, onCreateRoom]);

  const handleJoin = useCallback(() => {
    if (!name.trim() || joinCode.length !== 4) return;
    savePlayerName(name.trim());
    onJoinRoom(joinCode.toUpperCase(), name.trim(), selectedSkinId);
  }, [name, joinCode, selectedSkinId, onJoinRoom]);

  const handleCopy = useCallback(() => {
    if (!roomCode) return;
    navigator.clipboard?.writeText(roomCode).then(
      () => setCopied(true),
      (err: unknown) => console.warn("[lobby] Copying the room code failed", err),
    );
  }, [roomCode]);

  const overlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: font.ui,
    padding: "8px",
  };

  // --- Room view (has room code) ---
  if (roomCode) {
    const readyCount = players.filter((p) => p.ready).length;
    return (
      <div style={overlay}>
        <GlassPanel style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "stretch", justifyContent: "center", gap: "clamp(16px, 4vw, 32px)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 240 }}>
            <ScreenTitle>Race Room</ScreenTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 16px", borderRadius: radius.md, background: "rgba(255,255,255,0.7)" }}>
              <span style={text.label}>Room code</span>
              <span style={{ ...text.numberXl, letterSpacing: "0.15em" }}>{roomCode}</span>
              <GlassButton variant="quiet" onClick={handleCopy} style={{ alignSelf: "flex-start", padding: "0 4px" }}>
                <CopyIcon />
                {copied ? "Copied" : "Copy code"}
              </GlassButton>
            </div>
            <p style={{ ...text.body, fontSize: "0.875rem" }}>
              {players.length < 2
                ? "Share the code with friends to race them."
                : "The race starts when everyone is ready."}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "min(320px, 80vw)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={text.label}>Riders</span>
              <span style={text.label}>
                <span style={{ fontFamily: font.mono }}>{readyCount}/{players.length}</span> ready
              </span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              {players.map((p) => (
                <li
                  key={p.id}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 12px", borderRadius: "12px", background: "rgba(255,255,255,0.7)" }}
                >
                  <RiderAvatar skinId={p.skinId} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: "0.95rem", fontWeight: 800, color: color.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                    {p.id === localPlayerId && <span style={{ fontWeight: 600, color: color.muted }}> (you)</span>}
                  </span>
                  <span
                    style={{
                      ...badge,
                      color: p.ready ? color.success : color.muted,
                      background: p.ready ? color.successBg : "rgba(30,41,59,0.06)",
                    }}
                  >
                    {p.ready ? "Ready" : "Not ready"}
                  </span>
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 4 }}>
              <GlassButton variant="quiet" onClick={onLeave}>Leave</GlassButton>
              <GlassButton variant={isReady ? "secondary" : "primary"} onClick={onReady} disabled={isReady}>
                {isReady ? "Waiting…" : "I'm ready"}
              </GlassButton>
            </div>
          </div>
        </GlassPanel>
      </div>
    );
  }

  // --- Create / Join view ---
  return (
    <div style={overlay}>
      <GlassPanel style={{ alignItems: "stretch", width: "min(760px, 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <ScreenTitle>Multiplayer</ScreenTitle>
          <GlassButton variant="quiet" onClick={onLeave}>Back</GlassButton>
        </div>

        <div style={fieldStyle}>
          <span style={text.label}>Rider</span>
          <SkinPicker
            selectedSkinId={selectedSkinId}
            bestScore={skinState.bestScore}
            cheatUnlocked={skinState.cheatUnlocked}
            onSelectSkin={handleSelectSkin}
          />
        </div>

        {/* Name, then the two ways in, read left to right; wraps to a column on narrow screens */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
          <div style={{ ...fieldStyle, flex: "1 1 180px" }}>
            <label htmlFor="mp-name" style={text.label}>Your name</label>
            <input
              id="mp-name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setTypedName(e.target.value)}
              maxLength={MAX_NAME_LENGTH}
              style={input}
            />
          </div>
          <div style={{ ...fieldStyle, flex: "1 1 150px" }}>
            <span style={text.label}>Host a race</span>
            <GlassButton variant="primary" onClick={handleCreate} disabled={!canStart}>
              Create room
            </GlassButton>
          </div>
          <div style={{ ...fieldStyle, flex: "1 1 200px" }}>
            <label htmlFor="mp-code" style={text.label}>Join with a code</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="mp-code"
                type="text"
                placeholder="ABCD"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJoin();
                }}
                maxLength={4}
                autoCapitalize="characters"
                autoComplete="off"
                style={{
                  ...input,
                  flex: 1,
                  width: 0,
                  padding: "0 8px",
                  fontFamily: font.mono,
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textAlign: "center",
                }}
              />
              <GlassButton variant="secondary" onClick={handleJoin} disabled={!canJoin} style={{ padding: "0 18px" }}>
                Join
              </GlassButton>
            </div>
          </div>
        </div>

        {connecting && <p style={{ ...text.body, fontSize: "0.875rem", color: color.muted }}>Connecting…</p>}

        {!connecting && error && (
          <p role="alert" style={{ ...text.body, fontSize: "0.875rem", fontWeight: 700, color: color.danger }}>
            {error}
          </p>
        )}
      </GlassPanel>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}
