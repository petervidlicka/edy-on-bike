import { INITIAL_SPEED } from "@/game/constants";

interface HUDProps {
  score: number;
  speed: number;
  musicMuted: boolean;
  sfxMuted: boolean;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  onBackflip: () => void;
}

function MusicIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="18"
      height="18"
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
      width="18"
      height="18"
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
  background: "rgba(255,255,255,0.35)",
  border: "1px solid rgba(30,41,59,0.3)",
  borderRadius: "6px",
  color: "#1e293b",
  cursor: "pointer",
  padding: "0.35rem 0.5rem",
  lineHeight: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default function HUD({
  score,
  speed,
  musicMuted,
  sfxMuted,
  onToggleMusic,
  onToggleSfx,
  onBackflip,
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
            color: "#1e293b",
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: "1.25rem",
            fontWeight: "bold",
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

      {/* Backflip button — bottom right (mobile) */}
      <button
        onTouchStart={(e) => {
          e.preventDefault();
          onBackflip();
        }}
        title="Backflip (↓)"
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "1.5rem",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.35)",
          border: "2px solid rgba(30,41,59,0.3)",
          color: "#1e293b",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Down-arrow chevron */}
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </>
  );
}
