"use client";

import { useState, useEffect, useCallback, useRef } from "react";

function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as unknown as { webkitFullscreenElement: Element | null })
      .webkitFullscreenElement
  );
}

function requestFullscreen(el: HTMLElement): Promise<void> {
  if (el.requestFullscreen) {
    return el.requestFullscreen();
  }
  const webkit = el as unknown as { webkitRequestFullscreen?: () => void };
  if (webkit.webkitRequestFullscreen) {
    webkit.webkitRequestFullscreen();
    return Promise.resolve();
  }
  return Promise.reject(new Error("Fullscreen API not supported"));
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

  const tryFullscreen = useCallback(() => {
    if (isFullscreen()) return;
    requestFullscreen(document.documentElement)
      .then(() => {
        setShowFullscreenPrompt(false);
        clearDismissTimer();
      })
      .catch(() => {
        // Fullscreen needs a user gesture — show tap prompt
        setShowFullscreenPrompt(true);
        clearDismissTimer();
        dismissTimer.current = setTimeout(() => {
          setShowFullscreenPrompt(false);
        }, 5000);
      });
  }, [clearDismissTimer]);

  const handleFullscreenTap = useCallback(() => {
    requestFullscreen(document.documentElement).catch(() => {});
    setShowFullscreenPrompt(false);
    clearDismissTimer();
  }, [clearDismissTimer]);

  useEffect(() => {
    const check = () => {
      const portrait = window.matchMedia("(orientation: portrait)").matches;
      // Only block on touch devices — desktop portrait windows are fine
      const touch = window.matchMedia("(pointer: coarse)").matches;
      setShowOverlay(portrait && touch);

      // When rotating to landscape on mobile, try to enter fullscreen
      if (!portrait && touch) {
        tryFullscreen();
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

    // Hide prompt if fullscreen is entered via other means
    const onFsChange = () => {
      if (isFullscreen()) {
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
  }, [tryFullscreen, clearDismissTimer]);

  return (
    <>
      {children}

      {showFullscreenPrompt && (
        <button
          onClick={handleFullscreenTap}
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
            padding: "0.6rem 1.6rem",
            fontSize: "0.95rem",
            fontWeight: 700,
            fontFamily: "var(--font-nunito), Arial, sans-serif",
            cursor: "pointer",
            boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            letterSpacing: "0.02em",
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
