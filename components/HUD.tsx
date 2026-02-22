import { INITIAL_SPEED } from "@/game/constants";

interface HUDProps {
  score: number;
  speed: number;
  trickFeedback: { name: string; points: number } | null;
  musicMuted: boolean;
  sfxMuted: boolean;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  onBackflip: () => void;
  onFrontflip: () => void;
  onSuperman: () => void;
  onNoHander: () => void;
}

function MusicIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Musical note */}
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      {muted && (
        <>
          <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.5" />
        </>
      )}
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      {muted ? (
        <>
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </>
      ) : (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      )}
    </svg>
  );
}

const btnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.22)",
  backdropFilter: "blur(24px) saturate(200%)",
  WebkitBackdropFilter: "blur(24px) saturate(200%)",
  border: "1.5px solid rgba(255,255,255,0.55)",
  borderRadius: "14px",
  color: "#1e293b",
  cursor: "pointer",
  padding: "0.45rem 0.65rem",
  lineHeight: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow:
    "0 2px 16px rgba(0,0,0,0.1), inset 0 1.5px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.04)",
};

const dpadBtnStyle: React.CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.35)",
  border: "2px solid rgba(30,41,59,0.3)",
  color: "#1e293b",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

function ArrowSVG({ points }: { points: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={points} />
    </svg>
  );
}

export default function HUD({
  score,
  speed,
  trickFeedback,
  musicMuted,
  sfxMuted,
  onToggleMusic,
  onToggleSfx,
  onBackflip,
  onFrontflip,
  onSuperman,
  onNoHander,
}: HUDProps) {
  const multiplier = (speed / INITIAL_SPEED).toFixed(1);

  return (
    <>
      {/* Score + speed — top right */}
      <div
        style={{
          position: "fixed",
          top: "1rem",
          right: "1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "0.2rem",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            color: trickFeedback ? "#f0c030" : "#1e293b",
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: "1.25rem",
            fontWeight: "bold",
            transition: "color 0.3s ease",
          }}
        >
          {String(score).padStart(5, "0")}
        </span>
        <span
          style={{
            color: "#475569",
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: "0.75rem",
          }}
        >
          &times;{multiplier}
        </span>
        {trickFeedback && (
          <span
            style={{
              color: "#f0c030",
              fontFamily: "var(--font-space-mono), monospace",
              fontSize: "0.7rem",
              fontWeight: "bold",
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            {trickFeedback.name} +{trickFeedback.points}
          </span>
        )}
      </div>

      {/* Audio toggles — top left */}
      <div
        style={{
          position: "fixed",
          top: "1rem",
          left: "1.5rem",
          display: "flex",
          gap: "0.4rem",
        }}
      >
        <button
          onClick={onToggleMusic}
          title={musicMuted ? "Music on" : "Music off"}
          style={btnStyle}
        >
          <MusicIcon muted={musicMuted} />
        </button>
        <button
          onClick={onToggleSfx}
          title={sfxMuted ? "Sound on" : "Sound off"}
          style={btnStyle}
        >
          <SpeakerIcon muted={sfxMuted} />
        </button>
      </div>

      {/* D-pad — bottom right (mobile trick controls) */}
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          display: "grid",
          gridTemplateColumns: "48px 48px 48px",
          gridTemplateRows: "48px 48px 48px",
          gap: "4px",
        }}
      >
        {/* Row 1: _, Up (Frontflip), _ */}
        <div />
        <button
          onTouchStart={(e) => { e.preventDefault(); onFrontflip(); }}
          title="Frontflip (↑)"
          style={dpadBtnStyle}
        >
          <ArrowSVG points="6 15 12 9 18 15" />
        </button>
        <div />

        {/* Row 2: Left (Superman), _, Right (No Hander) */}
        <button
          onTouchStart={(e) => { e.preventDefault(); onSuperman(); }}
          title="Superman (←)"
          style={dpadBtnStyle}
        >
          <ArrowSVG points="15 6 9 12 15 18" />
        </button>
        <div />
        <button
          onTouchStart={(e) => { e.preventDefault(); onNoHander(); }}
          title="No Hander (→)"
          style={dpadBtnStyle}
        >
          <ArrowSVG points="9 6 15 12 9 18" />
        </button>

        {/* Row 3: _, Down (Backflip), _ */}
        <div />
        <button
          onTouchStart={(e) => { e.preventDefault(); onBackflip(); }}
          title="Backflip (↓)"
          style={dpadBtnStyle}
        >
          <ArrowSVG points="6 9 12 15 18 9" />
        </button>
        <div />
      </div>
    </>
  );
}
