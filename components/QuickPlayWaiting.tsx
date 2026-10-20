"use client";

/**
 * Quick-play waiting screen: shows how many riders are queued and the seconds left
 * before the race starts, and offers alternatives when nobody else turns up.
 */
import { useEffect, useState } from "react";
import type { QuickPlayQueue } from "@/hooks/useMultiplayerRoom";
import { GlassPanel } from "./ui/GlassPanel";
import { ScreenTitle } from "./ui/ScreenTitle";
import { GlassButton } from "./ui/GlassButton";
import { color, font, text } from "./ui/tokens";

interface QuickPlayWaitingProps {
  queue: QuickPlayQueue;
  /** Leave the queue and go to single player. */
  onRideSolo: () => void;
  /** Leave the queue and go back to create/join. */
  onCancel: () => void;
}

/** Re-renders a few times a second while a countdown is running. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

/**
 * Searching → (match found | nobody around). "Keep waiting" only hides the prompt:
 * the rider never left the queue, so the next arrival still gets matched with them.
 * @param props - Queue state from useMultiplayerRoom, plus the ride-solo and cancel actions.
 * @example
 * <QuickPlayWaiting queue={queue} onRideSolo={leave} onCancel={cancelQuickPlay} />
 */
export function QuickPlayWaiting({ queue, onRideSolo, onCancel }: QuickPlayWaitingProps) {
  const [dismissedLonely, setDismissedLonely] = useState(false);
  const now = useNow(queue.deadlineAt !== null);
  const secondsLeft = queue.deadlineAt === null ? null : Math.max(0, Math.ceil((queue.deadlineAt - now) / 1000));
  const showLonely = queue.lonely && !dismissedLonely && !queue.matched && queue.waiting < 2;

  let status: string;
  if (queue.matched) {
    status = "Riders found. Get ready!";
  } else if (queue.waiting >= 2) {
    status = secondsLeft === null
      ? `${queue.waiting} riders ready`
      : `${queue.waiting} riders ready · starting in ${secondsLeft}s`;
  } else if (secondsLeft !== null) {
    status = `Waiting for riders… ${secondsLeft}s`;
  } else {
    status = "Still looking. We'll start as soon as someone joins.";
  }

  return (
    <div style={containerStyle}>
      <GlassPanel style={{ minWidth: "min(340px, 90vw)" }}>
        <ScreenTitle>Quick Play</ScreenTitle>

        <div style={spinnerStyle} aria-hidden />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textAlign: "center" }}>
          <span role="status" style={{ ...text.body, color: color.ink, fontWeight: 800 }}>
            {status}
          </span>
          {showLonely && (
            <span style={{ ...text.body, fontSize: "0.875rem", color: color.muted }}>
              Nobody else is riding right now.
            </span>
          )}
        </div>

        {showLonely ? (
          <div style={rowStyle}>
            <GlassButton variant="quiet" onClick={onCancel}>Back</GlassButton>
            <GlassButton variant="secondary" onClick={onRideSolo}>Ride solo</GlassButton>
            <GlassButton variant="primary" onClick={() => setDismissedLonely(true)}>Keep waiting</GlassButton>
          </div>
        ) : (
          !queue.matched && (
            <GlassButton variant="quiet" onClick={onCancel}>Cancel</GlassButton>
          )
        )}
      </GlassPanel>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: font.ui,
  padding: "8px",
};

const spinnerStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "4px solid rgba(39,67,94,0.15)",
  borderTopColor: color.navy,
  animation: "quickplay-spin 0.9s linear infinite",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
};
