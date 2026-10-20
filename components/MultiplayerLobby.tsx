"use client";

/**
 * Multiplayer lobby: quick play (matchmaking) or create/join a room by code, pick a
 * skin (same unlocks as single-player), then wait for everyone to ready up.
 */
import { useState, useCallback, useEffect } from "react";
import {
  FRIEND_CODE_LENGTH, MAX_NAME_LENGTH, ROOM_CODE_CHARS, isFriendRoomCode,
} from "@/game/multiplayer/protocol";
import type { PlayerInfo } from "@/game/multiplayer/protocol";
import { SkinId } from "@/game/types";
import SkinPicker from "@/components/SkinPicker";
import { QuickPlayWaiting } from "@/components/QuickPlayWaiting";
import type { QuickPlayQueue } from "@/hooks/useMultiplayerRoom";
import { useSavedSkinState } from "@/hooks/useSavedSkinState";
import { useSavedPlayerName } from "@/hooks/useSavedPlayerName";
import { savePlayerName } from "@/game/storage";
import { getSkinById } from "@/game/skins";
import { SkinPreview } from "./SkinPreview";
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
  /** Matchmade room — there's no code worth sharing. */
  quickPlay?: boolean;
  /** Set while searching for a quick-play match. */
  queue?: QuickPlayQueue | null;
  onQuickPlay: (name: string, skinId: SkinId) => void;
  onCancelQuickPlay: () => void;
  onCreateRoom: (name: string, skinId: SkinId) => void;
  onJoinRoom: (code: string, name: string, skinId: SkinId) => void;
  onReady: () => void;
  onLeave: () => void;
}

/** How long "Copied" / "Can't copy" shows before the button reads "Copy code" again. */
const COPY_FEEDBACK_MS = 2000;

/**
 * Uppercases typed or pasted text and keeps only characters that can appear in a room
 * code, so stray symbols can't reach the socket URL and look-alikes (O/0, I/1) never match.
 */
function toRoomCodeInput(raw: string): string {
  return Array.from(raw.toUpperCase())
    .filter((ch) => ROOM_CODE_CHARS.includes(ch))
    .join("")
    .slice(0, FRIEND_CODE_LENGTH);
}

/** Lays out a labelled field: caps label above its control. */
const fieldStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, minWidth: 0 };

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
  quickPlay = false,
  queue = null,
  onQuickPlay,
  onCancelQuickPlay,
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
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  const localPlayer = players.find((p) => p.id === localPlayerId);
  const isReady = localPlayer?.ready ?? false;

  const canStart = !!name.trim() && !connecting;
  const canJoin = canStart && isFriendRoomCode(joinCode);

  // Same guards as the buttons' disabled state, so Enter can't send a second request mid-connect
  const handleQuickPlay = useCallback(() => {
    if (!canStart) return;
    savePlayerName(name.trim());
    onQuickPlay(name.trim(), selectedSkinId);
  }, [canStart, name, selectedSkinId, onQuickPlay]);

  const handleCreate = useCallback(() => {
    if (!canStart) return;
    savePlayerName(name.trim());
    onCreateRoom(name.trim(), selectedSkinId);
  }, [canStart, name, selectedSkinId, onCreateRoom]);

  const handleJoin = useCallback(() => {
    if (!canJoin) return;
    savePlayerName(name.trim());
    onJoinRoom(joinCode.toUpperCase(), name.trim(), selectedSkinId);
  }, [canJoin, name, joinCode, selectedSkinId, onJoinRoom]);

  // The label flips back after a moment, so a second copy (or a retry) reads as a fresh action
  useEffect(() => {
    if (copyStatus === "idle") return;
    const id = setTimeout(() => setCopyStatus("idle"), COPY_FEEDBACK_MS);
    return () => clearTimeout(id);
  }, [copyStatus]);

  const handleCopy = useCallback(() => {
    if (!roomCode) return;
    // No clipboard API outside secure contexts (e.g. testing over a LAN IP) — say so rather than do nothing
    if (!navigator.clipboard) {
      setCopyStatus("failed");
      return;
    }
    navigator.clipboard.writeText(roomCode).then(
      () => setCopyStatus("copied"),
      (err: unknown) => {
        console.warn("[lobby] Copying the room code failed", err);
        setCopyStatus("failed");
      },
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

  if (queue && !roomCode) {
    return <QuickPlayWaiting queue={queue} onRideSolo={onLeave} onCancel={onCancelQuickPlay} />;
  }

  // --- Room view (has room code) ---
  if (roomCode) {
    const readyCount = players.filter((p) => p.ready).length;
    const everyoneReady = players.length >= 2 && readyCount === players.length;
    return (
      <div style={overlay}>
        <GlassPanel style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "stretch", justifyContent: "center", gap: "clamp(16px, 4vw, 32px)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 240 }}>
            <ScreenTitle>{quickPlay ? "Quick Play" : "Race Room"}</ScreenTitle>
            {!quickPlay && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 16px", borderRadius: radius.md, background: "rgba(255,255,255,0.7)" }}>
                <span style={text.label}>Room code</span>
                <span style={{ ...text.numberXl, letterSpacing: "0.15em" }}>{roomCode}</span>
                <GlassButton variant="quiet" onClick={handleCopy} style={{ alignSelf: "flex-start", padding: "0 4px" }}>
                  <CopyIcon />
                  {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Can't copy" : "Copy code"}
                </GlassButton>
              </div>
            )}
            <p style={{ ...text.body, fontSize: "0.875rem" }}>
              {players.length < 2
                ? quickPlay
                  ? "Waiting for the other riders…"
                  : "Share the code with friends to race them."
                : everyoneReady
                  ? "Starting…"
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
                  <SkinPreview skin={getSkinById(p.skinId)} style={{ width: 36, height: 40 }} />
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
          <GlassButton variant="quiet" onClick={onLeave} aria-label="Back to single player">Back</GlassButton>
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

        {/* Name, then the ways in (quick play first, it's the default), read left to right; wraps on narrow screens */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
          <div style={{ ...fieldStyle, flex: "1 1 160px" }}>
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
          <div style={{ ...fieldStyle, flex: "1 1 140px" }}>
            <span style={text.label}>Race anyone</span>
            <GlassButton variant="primary" onClick={handleQuickPlay} disabled={!canStart}>
              Quick play
            </GlassButton>
          </div>
          <div style={{ ...fieldStyle, flex: "1 1 140px" }}>
            <span style={text.label}>Host a race</span>
            <GlassButton variant="secondary" onClick={handleCreate} disabled={!canStart}>
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
                onChange={(e) => setJoinCode(toRoomCodeInput(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJoin();
                }}
                maxLength={FRIEND_CODE_LENGTH}
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
