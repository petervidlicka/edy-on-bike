/**
 * Layout A of the game-over screen: a compact summary with one big "Play again".
 * Used for runs that don't make the board, and as the fallback when the
 * leaderboard can't be reached or arrived too late to pick the layout (then it also
 * offers "Save score").
 */
import { GameOverPrimaryButton } from "./GameOverPrimaryButton";
import { GameOverLinkButton } from "./GameOverLinkButton";
import { useRestartKeys } from "@/hooks/useRestartKeys";

interface GameOverSummaryProps {
  locked: boolean;
  /**
   * Offer a manual "Save score": the board couldn't be loaded, or it loaded after the layout
   * was settled and the score turned out to qualify.
   */
  offerSave: boolean;
  onRestart: () => void;
  onShowLeaderboard: () => void;
  onSaveScore: () => void;
}

/**
 * Owns the Space/Enter/R keys while mounted (the form and leaderboard views are not mounted then).
 * @param props - Lockout flag, whether to offer saving, and the actions this view can trigger.
 * @example
 * <GameOverSummary locked={locked} offerSave={false} onRestart={r} onShowLeaderboard={s} onSaveScore={f} />
 */
export function GameOverSummary({ locked, offerSave, onRestart, onShowLeaderboard, onSaveScore }: GameOverSummaryProps) {
  useRestartKeys(onRestart, locked);

  return (
    <>
      <GameOverPrimaryButton onClick={onRestart} disabled={locked}>
        ▶ Play again
      </GameOverPrimaryButton>
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
        {offerSave && <GameOverLinkButton onClick={onSaveScore}>Save score</GameOverLinkButton>}
        <GameOverLinkButton onClick={onShowLeaderboard}>See leaderboard</GameOverLinkButton>
      </div>
      <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: "#64748b", letterSpacing: "0.04em" }}>
        press Space or tap anywhere
      </p>
    </>
  );
}
