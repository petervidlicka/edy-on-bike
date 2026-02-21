"use client";

import { useState, useEffect } from "react";

export default function OrientationGuard({ children }: { children: React.ReactNode }) {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const check = () => {
      const portrait = window.matchMedia("(orientation: portrait)").matches;
      // Only block on touch devices — desktop portrait windows are fine
      const touch = window.matchMedia("(pointer: coarse)").matches;
      setShowOverlay(portrait && touch);
    };

    check();
    const mq = window.matchMedia("(orientation: portrait)");
    mq.addEventListener("change", check);
    // Legacy fallback
    window.addEventListener("orientationchange", check);
    return () => {
      mq.removeEventListener("change", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  return (
    <>
      {children}
      {showOverlay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#1e293b",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.25rem",
            fontFamily: "var(--font-nunito), Arial, sans-serif",
          }}
        >
          {/* Rotation icon */}
          <svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity: 0.85 }}
          >
            {/* Phone outline */}
            <rect
              x="22"
              y="8"
              width="28"
              height="48"
              rx="5"
              stroke="#b8c6d4"
              strokeWidth="3"
              fill="none"
            />
            <circle cx="36" cy="50" r="2.5" fill="#b8c6d4" />
            {/* Rotation arrow */}
            <path
              d="M52 36 C52 22 40 14 28 18"
              stroke="#c4785a"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <polyline
              points="24,14 28,18 24,22"
              stroke="#c4785a"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <p
            style={{
              color: "#b8c6d4",
              fontSize: "1.2rem",
              fontWeight: 700,
              margin: 0,
              textAlign: "center",
              letterSpacing: "0.03em",
            }}
          >
            Please rotate your device
          </p>
          <p
            style={{
              color: "#64748b",
              fontSize: "0.9rem",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Edy rides best in landscape
          </p>
        </div>
      )}
    </>
  );
}
