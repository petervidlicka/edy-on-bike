"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import OrientationGuard from "@/components/OrientationGuard";
import MultiplayerLobby from "@/components/MultiplayerLobby";
import MultiplayerGameCanvas from "@/components/MultiplayerGameCanvas";
import MultiplayerResults from "@/components/MultiplayerResults";
import { useMultiplayerRoom } from "@/hooks/useMultiplayerRoom";

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
    countdownEndMs,
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

  const handleRaceFinished = useCallback(() => {
    // Phase will transition to "finished" via the adapter/hook
  }, []);

  return (
    <OrientationGuard>
      {/* Lobby phase */}
      {(phase === "lobby" || !roomCode) &&
        phase !== "countdown" &&
        phase !== "racing" &&
        phase !== "finished" && (
          <MultiplayerLobby
            roomCode={roomCode}
            localPlayerId={localPlayerId}
            players={players}
            phase={phase}
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
          roomCode={roomCode!}
          seed={seed}
          players={players}
          localPlayerId={localPlayerId}
          adapter={adapter}
          onRaceFinished={handleRaceFinished}
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
