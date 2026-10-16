/**
 * Layout A of the game-over screen: a compact summary with one big "Play again".
 * Used for runs that don't make the board, and as the fallback when the
 * leaderboard can't be reached (then it also offers "Save score").
 */
import { GameOverPrimaryButton } from "./GameOverPrimaryButton";
import { GameOverLinkButton } from "./GameOverLinkButton";
import { useRestartKeys } from "@/hooks/useRestartKeys";

interface GameOverSummaryProps {
  locked: boolean;
  /** The board couldn't be loaded; offer a manual "Save score" instead of the auto-prompt. */
  leaderboardFailed: boolean;
  onRestart: () => void;
  onShowLeaderboard: () => void;
  onSaveScore: () => void;
}

/**
 * Owns the Space/Enter/R keys while mounted (the form and leaderboard views are not mounted then).
 * @param props - Lockout flag, failure flag and the actions this view can trigger.
 * @example
 * <GameOverSummary locked={locked} leaderboardFailed={false} onRestart={r} onShowLeaderboard={s} onSaveScore={f} />
 */
export function GameOverSummary({ locked, leaderboardFailed, onRestart, onShowLeaderboard, onSaveScore }: GameOverSummaryProps) {
  useRestartKeys(onRestart, locked);

  return (
    <>
      <GameOverPrimaryButton onClick={onRestart} disabled={locked}>
        ▶ Play again
      </GameOverPrimaryButton>
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
        {leaderboardFailed && <GameOverLinkButton onClick={onSaveScore}>Save score</GameOverLinkButton>}
        <GameOverLinkButton onClick={onShowLeaderboard}>See leaderboard</GameOverLinkButton>
      </div>
      <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: "#64748b", letterSpacing: "0.04em" }}>
        press Space or tap anywhere
      </p>
    </>
  );
}
