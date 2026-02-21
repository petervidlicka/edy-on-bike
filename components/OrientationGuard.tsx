"use client";

import { useState, useEffect, useCallback, useRef } from "react";

function getFullscreenElement(): Element | null {
  return (
    document.fullscreenElement ||
    (document as unknown as { webkitFullscreenElement: Element | null })
      .webkitFullscreenElement
  );
}

function canFullscreen(): boolean {
  const el = document.documentElement;
  return !!(
    el.requestFullscreen ||
    (el as unknown as { webkitRequestFullscreen?: () => void })
      .webkitRequestFullscreen
  );
}

export default function OrientationGuard({ children }: { children: React.ReactNode }) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  // Must be called synchronously inside a user-gesture handler (pointerup / click).
  // Tries document.documentElement first, then document.body as fallback.
  const handleFullscreenTap = useCallback(() => {
    if (getFullscreenElement()) {
      setShowFullscreenPrompt(false);
      clearDismissTimer();
      return;
    }

    const targets = [document.documentElement, document.body];
    for (const el of targets) {
      try {
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(() => {});
          return; // request dispatched — fullscreenchange will hide the prompt
        }
        const webkit = el as unknown as { webkitRequestFullscreen?: () => void };
        if (webkit.webkitRequestFullscreen) {
          webkit.webkitRequestFullscreen();
          return;
        }
      } catch {
        // try next target
      }
    }
  }, [clearDismissTimer]);

  useEffect(() => {
    const check = () => {
      const portrait = window.matchMedia("(orientation: portrait)").matches;
      // Only block on touch devices — desktop portrait windows are fine
      const touch = window.matchMedia("(pointer: coarse)").matches;
      setShowOverlay(portrait && touch);

      // When rotating to landscape on mobile, show the fullscreen prompt
      // (auto-requesting fullscreen here would fail — it requires a user gesture)
      if (!portrait && touch && !getFullscreenElement() && canFullscreen()) {
        setShowFullscreenPrompt(true);
        clearDismissTimer();
        dismissTimer.current = setTimeout(() => {
          setShowFullscreenPrompt(false);
        }, 5000);
      } else {
        setShowFullscreenPrompt(false);
        clearDismissTimer();
      }
    };

    check();
    const mq = window.matchMedia("(orientation: portrait)");
    mq.addEventListener("change", check);
    // Legacy fallback
    window.addEventListener("orientationchange", check);

    // Hide prompt once fullscreen is entered (by tap or any other means)
    const onFsChange = () => {
      if (getFullscreenElement()) {
        setShowFullscreenPrompt(false);
        clearDismissTimer();
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);

    return () => {
      mq.removeEventListener("change", check);
      window.removeEventListener("orientationchange", check);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      clearDismissTimer();
    };
  }, [clearDismissTimer]);

  return (
    <>
      {children}

      {showFullscreenPrompt && (
        <button
          onPointerUp={handleFullscreenTap}
          style={{
            position: "fixed",
            bottom: "1.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9998,
            background: "rgba(196,120,90,0.9)",
            color: "#fff",
            border: "none",
            borderRadius: "2rem",
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            fontWeight: 700,
            fontFamily: "var(--font-nunito), Arial, sans-serif",
            cursor: "pointer",
            boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            letterSpacing: "0.02em",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
            animation: "fadeInUp 0.3s ease-out",
          }}
        >
          Tap for fullscreen
        </button>
      )}

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
