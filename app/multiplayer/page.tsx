"use client";

/**
 * /multiplayer route: switches between lobby, race and results based on the
 * room phase reported by the PartyKit server (via useMultiplayerRoom).
 */
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import OrientationGuard from "@/components/OrientationGuard";
import MultiplayerLobby from "@/components/MultiplayerLobby";
import MultiplayerGameCanvas from "@/components/MultiplayerGameCanvas";
import MultiplayerResults from "@/components/MultiplayerResults";
import { useMultiplayerRoom } from "@/hooks/useMultiplayerRoom";

/** Multiplayer entry point; owns the room connection for the whole lobby → race → results loop. */
export default function MultiplayerPage() {
  const router = useRouter();
  const {
    connectionState,
    roomCode,
    players,
    phase,
    seed,
    localPlayerId,
    rankings,
    adapter,
    error,
    createRoom,
    joinRoom,
    setReady,
    playAgain,
    disconnect,
  } = useMultiplayerRoom();

  const handleLeave = useCallback(() => {
    disconnect();
    router.push("/");
  }, [disconnect, router]);

  return (
    <OrientationGuard>
      {/* Lobby phase */}
      {phase === "lobby" && (
        <MultiplayerLobby
          roomCode={roomCode}
          localPlayerId={localPlayerId}
          players={players}
          error={error}
          connecting={connectionState !== "disconnected" && !roomCode}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onReady={setReady}
          onLeave={handleLeave}
        />
      )}

      {/* Racing phase (includes countdown) */}
      {(phase === "countdown" || phase === "racing") && adapter && (
        <MultiplayerGameCanvas
          seed={seed}
          raceStarted={phase === "racing"}
          players={players}
          localPlayerId={localPlayerId}
          adapter={adapter}
          onLeave={handleLeave}
        />
      )}

      {/* Results phase */}
      {phase === "finished" && (
        <MultiplayerResults
          rankings={rankings}
          localPlayerId={localPlayerId}
          onPlayAgain={playAgain}
          onLeave={handleLeave}
        />
      )}
    </OrientationGuard>
  );
}
