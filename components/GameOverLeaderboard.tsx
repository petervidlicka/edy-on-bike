/**
 * Layout C of the game-over screen: the top-scores table, shown only when the
 * player asks for it (or right after saving), with their own row highlighted.
 */
import { LEADERBOARD_SIZE } from "@/lib/leaderboardConfig";
import type { GameOverLeaderboard as BoardData } from "@/hooks/useGameOverLeaderboard";
import { GameOverPrimaryButton } from "./GameOverPrimaryButton";
import { useRestartKeys } from "@/hooks/useRestartKeys";

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
      {board.status === "error" ? (
        <p style={{ color: "#b91c1c", fontSize: "0.85rem", fontWeight: 600, margin: "0.5rem 0" }}>{board.error}</p>
      ) : board.status === "loading" ? (
        <p style={{ color: "#475569", fontSize: "0.85rem", margin: "0.5rem 0" }}>Loading scores…</p>
      ) : rows.length > 0 ? (
        <div
          style={{
            background: "rgba(255,255,255,0.72)",
            borderRadius: "10px",
            padding: "0.65rem 1.1rem",
            minWidth: "260px",
            maxWidth: "360px",
            marginTop: "0.25rem",
            pointerEvents: "auto",
          }}
        >
          <h3
            style={{
              margin: "0 0 0.4rem",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "#1e293b",
              textAlign: "center",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
            }}
          >
            Top Scores
          </h3>
          <ol
            style={{
              margin: 0,
              padding: "0 0 0 1.3rem",
              fontSize: "0.8rem",
              color: "#334155",
              lineHeight: 1.65,
              fontFamily: "var(--font-space-mono), monospace",
            }}
          >
            {rows.map((entry, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.4rem",
                  ...(i === savedIndex
                    ? { background: "rgba(234,179,8,0.28)", borderRadius: "6px", margin: "0 -0.4rem", padding: "0 0.4rem" }
                    : null),
                }}
              >
                <span style={{ fontWeight: 600, flex: "1 1 auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.name}</span>
                {entry.skin && (
                  <span style={{ fontSize: "0.65rem", color: "#64748b", whiteSpace: "nowrap" }}>{entry.skin}</span>
                )}
                <span style={{ fontWeight: 400, whiteSpace: "nowrap" }}>{String(entry.score).padStart(5, "0")}</span>
              </li>
            ))}
          </ol>
          {board.totalPlayers > 0 && (
            <p
              style={{
                margin: "0.45rem 0 0",
                fontSize: "0.72rem",
                color: "#64748b",
                textAlign: "center",
                fontWeight: 600,
                fontFamily: "var(--font-nunito), Arial, sans-serif",
              }}
            >
              {board.totalPlayers} total player{board.totalPlayers !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      ) : (
        <p style={{ color: "#475569", fontSize: "0.85rem", margin: "0.5rem 0" }}>No scores yet — be the first!</p>
      )}

      <GameOverPrimaryButton onClick={onRestart} disabled={locked}>
        ▶ Play again
      </GameOverPrimaryButton>
    </>
  );
}
