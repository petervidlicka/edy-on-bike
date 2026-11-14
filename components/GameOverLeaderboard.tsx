/**
 * Layout C of the game-over screen: the top-scores table, shown only when the
 * player asks for it (or right after saving), with their own row highlighted.
 */
import { LEADERBOARD_SIZE } from "@/lib/leaderboardConfig";
import type { GameOverLeaderboard as BoardData } from "@/hooks/useGameOverLeaderboard";
import { GameOverPrimaryButton } from "./GameOverPrimaryButton";
import { useRestartKeys } from "@/hooks/useRestartKeys";
import { ScreenTitle } from "./ui/ScreenTitle";
import { color, font, formatScore, text } from "./ui/tokens";

interface GameOverLeaderboardProps {
  board: BoardData;
  /** The row to highlight: the entry the player just saved, if any. */
  saved: { name: string; score: number } | null;
  locked: boolean;
  onRestart: () => void;
}

/**
 * Owns the Space/Enter/R keys while mounted.
 * @param props - Board data, the player's saved entry, lockout flag and the restart action.
 * @example
 * <GameOverLeaderboard board={board} saved={null} locked={false} onRestart={restart} />
 */
export function GameOverLeaderboard({ board, saved, locked, onRestart }: GameOverLeaderboardProps) {
  useRestartKeys(onRestart, locked);
  const rows = board.entries.slice(0, LEADERBOARD_SIZE);
  const savedIndex = saved ? rows.findIndex((r) => r.name === saved.name && r.score === saved.score) : -1;

  return (
    <>
      <ScreenTitle>Top Scores</ScreenTitle>
      {board.status === "error" ? (
        <p role="alert" style={{ ...text.body, color: color.danger, fontSize: "0.875rem" }}>{board.error}</p>
      ) : board.status === "loading" ? (
        <p style={{ ...text.body, color: color.muted, fontSize: "0.875rem" }}>Loading scores…</p>
      ) : rows.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "min(320px, 80vw)" }}>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
            {rows.map((entry, i) => {
              const mine = i === savedIndex;
              return (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "4px 12px",
                    borderRadius: "12px",
                    color: mine ? color.white : color.ink,
                    background: mine ? color.navy : "rgba(255,255,255,0.6)",
                  }}
                >
                  <span style={{ width: 20, fontFamily: font.mono, fontSize: "0.8rem", fontWeight: 700 }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.name}
                    </span>
                    {entry.skin && (
                      <span style={{ fontSize: "0.7rem", fontWeight: 600, color: mine ? "rgba(255,255,255,0.85)" : color.muted }}>
                        {entry.skin}
                      </span>
                    )}
                  </span>
                  <span style={{ fontFamily: font.mono, fontSize: "0.875rem", fontWeight: 700 }}>{formatScore(entry.score)}</span>
                </li>
              );
            })}
          </ol>
          {board.totalPlayers > 0 && (
            <p style={{ ...text.label, textAlign: "center", textTransform: "none", letterSpacing: "0.02em" }}>
              {board.totalPlayers} total player{board.totalPlayers !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      ) : (
        <p style={{ ...text.body, color: color.muted, fontSize: "0.875rem" }}>No scores yet. Be the first!</p>
      )}

      <GameOverPrimaryButton onClick={onRestart} disabled={locked}>
        Play again
      </GameOverPrimaryButton>
    </>
  );
}
