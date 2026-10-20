"use client";

/**
 * Quick-play waiting screen: shows how many riders are queued and the seconds left
 * before the race starts, and offers alternatives when nobody else turns up.
 */
import { useEffect, useState } from "react";
import type { QuickPlayQueue } from "@/hooks/useMultiplayerRoom";

interface QuickPlayWaitingProps {
  queue: QuickPlayQueue;
  /** Glass button style shared with the lobby. */
  buttonStyle: React.CSSProperties;
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
 */
export function QuickPlayWaiting({ queue, buttonStyle, onRideSolo, onCancel }: QuickPlayWaitingProps) {
  const [dismissedLonely, setDismissedLonely] = useState(false);
  const now = useNow(queue.deadlineAt !== null);
  const secondsLeft = queue.deadlineAt === null ? null : Math.max(0, Math.ceil((queue.deadlineAt - now) / 1000));
  const showLonely = queue.lonely && !dismissedLonely && !queue.matched && queue.waiting < 2;

  let status: string;
  if (queue.matched) {
    status = "Riders found — get ready!";
  } else if (queue.waiting >= 2) {
    status = secondsLeft === null
      ? `${queue.waiting} riders ready`
      : `${queue.waiting} riders ready · starting in ${secondsLeft}s`;
  } else if (secondsLeft !== null) {
    status = `Waiting for riders… ${secondsLeft}s`;
  } else {
    status = "Still looking — we'll start as soon as someone joins.";
  }

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Quick Play</h2>

      <div style={spinnerStyle} aria-hidden />

      <div style={cardStyle}>
        <span role="status" style={{ color: "#1e293b", fontSize: "1rem", fontWeight: 700 }}>
          {status}
        </span>
        {showLonely && (
          <span style={{ color: "#475569", fontSize: "0.88rem", fontWeight: 600 }}>
            Nobody else is riding right now.
          </span>
        )}
      </div>

      {showLonely ? (
        <>
          <div style={rowStyle}>
            <button onClick={() => setDismissedLonely(true)} style={buttonStyle}>
              KEEP WAITING
            </button>
            <button onClick={onRideSolo} style={buttonStyle}>
              RIDE SOLO
            </button>
            <button onClick={onCancel} style={buttonStyle}>
              BACK
            </button>
          </div>
        </>
      ) : (
        !queue.matched && (
          <button onClick={onCancel} style={{ ...buttonStyle, marginTop: "0.5rem" }}>
            CANCEL
          </button>
        )
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "safe center",
  overflowY: "auto",
  gap: "0.9rem",
  fontFamily: "var(--font-nunito), Arial, sans-serif",
  padding: "1rem",
};

const titleStyle: React.CSSProperties = {
  color: "#27435E",
  fontSize: "2.2rem",
  fontFamily: "var(--font-fredoka), sans-serif",
  fontWeight: 600,
  margin: 0,
  letterSpacing: "0.04em",
  textShadow: "0 2px 6px rgba(255,255,255,0.4)",
};

/** Frosted panel so the status reads over the scrolling town behind it. */
const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.3rem",
  padding: "0.6rem 1.4rem",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.45)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.6)",
  textAlign: "center",
};

const spinnerStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "4px solid rgba(255,255,255,0.5)",
  borderTopColor: "#27435E",
  animation: "quickplay-spin 0.9s linear infinite",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap",
  justifyContent: "center",
};
