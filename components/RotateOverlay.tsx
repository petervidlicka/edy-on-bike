/**
 * Full-screen "rotate your device" overlay for phones held in portrait: the splash art
 * with the title above the rider and a glass bubble with a tilting phone on the road.
 */
import { color, font } from "./ui/tokens";

/** Sky colour behind the splash image while it loads. */
const SPLASH_BACKGROUND = "#b8c6d4";

/** Outline of a phone; `tiltPhone` (globals.css) rocks it into landscape. */
function PhoneIcon() {
  return (
    <div style={{ animation: "tiltPhone 2.5s infinite ease-in-out", transformOrigin: "center" }}>
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.95 }}>
        <rect x="22" y="8" width="28" height="48" rx="5" stroke={color.white} strokeWidth="3" fill="none" />
        <circle cx="36" cy="50" r="2.5" fill={color.white} />
      </svg>
    </div>
  );
}

/**
 * Covers everything (including the HUD) while shown; the engine pauses separately via usePauseOnHidden.
 * @example
 * {useIsPortraitPhone() && <RotateOverlay />}
 */
export function RotateOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: font.ui,
        overflow: "hidden",
        backgroundImage: "url(/splash-bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundColor: SPLASH_BACKGROUND,
      }}
    >
      {/* Title at the top — above the rider's head */}
      <div style={{ paddingTop: "env(safe-area-inset-top, 2rem)", marginTop: "2rem" }}>
        <h1
          style={{
            color: color.navy,
            fontSize: "2.2rem",
            fontFamily: font.display,
            fontWeight: 600,
            margin: 0,
            textShadow: "0 2px 12px rgba(255,255,255,0.4), 0 0 20px rgba(255,255,255,0.2)",
            letterSpacing: "0.03em",
            textAlign: "center",
          }}
        >
          Edy on Bike
        </h1>
      </div>

      {/* Liquid glass bubble — in the road/grass area */}
      <div
        style={{
          marginBottom: "clamp(3rem, 8vh, 5rem)",
          padding: "1.5rem 2.5rem",
          borderRadius: "1.5rem",
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(16px) saturate(1.4)",
          WebkitBackdropFilter: "blur(16px) saturate(1.4)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.8rem",
        }}
      >
        <PhoneIcon />
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              color: color.white,
              fontSize: "1.15rem",
              fontWeight: 700,
              margin: 0,
              letterSpacing: "0.03em",
              textShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }}
          >
            Please rotate your device
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "0.9rem",
              fontWeight: 600,
              margin: "0.3rem 0 0 0",
              textShadow: "0 1px 3px rgba(0,0,0,0.25)",
            }}
          >
            Edy rides best in landscape
          </p>
        </div>
      </div>
    </div>
  );
}
