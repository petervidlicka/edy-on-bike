"use client";

import { useState, useEffect, useCallback, useRef } from "react";

function getFullscreenElement(): Element | null {
  return (
    document.fullscreenElement ||
    (document as unknown as { webkitFullscreenElement: Element | null })
      .webkitFullscreenElement
  );
}

/** True when running as an installed PWA or launched from Home Screen. */
function isStandaloneMode(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  // iOS Safari standalone detection
  if ((navigator as unknown as { standalone?: boolean }).standalone === true)
    return true;
  return false;
}

type PromptMode = "hidden" | "fullscreen" | "install";

export default function OrientationGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [prompt, setPrompt] = useState<PromptMode>("hidden");
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const showTimedPrompt = useCallback(
    (mode: PromptMode) => {
      setPrompt(mode);
      clearDismissTimer();
      dismissTimer.current = setTimeout(() => {
        setPrompt("hidden");
      }, 6000);
    },
    [clearDismissTimer],
  );

  // Tap handler: try the Fullscreen API, fall back to "Add to Home Screen".
  const handleFullscreenTap = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (getFullscreenElement()) {
        setPrompt("hidden");
        clearDismissTimer();
        return;
      }

      const el = containerRef.current ?? document.documentElement;

      // Try standard API
      if (el.requestFullscreen) {
        el.requestFullscreen()
          .then(() => {
            setPrompt("hidden");
            clearDismissTimer();
          })
          .catch(() => {
            // API exists but was rejected — show install hint
            showTimedPrompt("install");
          });
        return;
      }

      // Try webkit-prefixed API
      const webkit = el as unknown as {
        webkitRequestFullscreen?: () => void;
      };
      if (webkit.webkitRequestFullscreen) {
        try {
          webkit.webkitRequestFullscreen();
          // No promise — rely on fullscreenchange event to hide prompt
        } catch {
          showTimedPrompt("install");
        }
        return;
      }

      // API not available at all — show install hint
      showTimedPrompt("install");
    },
    [clearDismissTimer, showTimedPrompt],
  );

  useEffect(() => {
    const check = () => {
      const portrait = window.matchMedia("(orientation: portrait)").matches;
      const touch = window.matchMedia("(pointer: coarse)").matches;
      setShowOverlay(portrait && touch);

      if (
        !portrait &&
        touch &&
        !getFullscreenElement() &&
        !isStandaloneMode()
      ) {
        showTimedPrompt("fullscreen");
      } else {
        setPrompt("hidden");
        clearDismissTimer();
      }
    };

    check();
    const mq = window.matchMedia("(orientation: portrait)");
    mq.addEventListener("change", check);
    window.addEventListener("orientationchange", check);

    const onFsChange = () => {
      if (getFullscreenElement()) {
        setPrompt("hidden");
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
  }, [clearDismissTimer, showTimedPrompt]);

  const isIOS =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  return (
    <div ref={containerRef}>
      {children}

      {prompt === "fullscreen" && (
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

      {prompt === "install" && (
        <div
          onClick={() => {
            setPrompt("hidden");
            clearDismissTimer();
          }}
          style={{
            position: "fixed",
            bottom: "1.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9998,
            background: "rgba(30,41,59,0.95)",
            color: "#b8c6d4",
            border: "1px solid rgba(196,120,90,0.4)",
            borderRadius: "1rem",
            padding: "0.75rem 1.5rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            fontFamily: "var(--font-nunito), Arial, sans-serif",
            textAlign: "center",
            lineHeight: 1.5,
            boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
            animation: "fadeInUp 0.3s ease-out",
            cursor: "pointer",
            maxWidth: "90vw",
          }}
        >
          {isIOS ? (
            <>
              Tap{" "}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  display: "inline",
                  verticalAlign: "middle",
                  margin: "0 0.15em",
                }}
              >
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>{" "}
              then <strong>&quot;Add to Home Screen&quot;</strong> for fullscreen
            </>
          ) : (
            <>
              Open browser menu → <strong>Add to Home Screen</strong> for
              fullscreen
            </>
          )}
        </div>
      )}

      {showOverlay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            fontFamily: "var(--font-nunito), Arial, sans-serif",
            overflow: "hidden",
          }}
        >
          {/* Background Blurred Image */}
          <div
            style={{
              position: "absolute",
              inset: -20, // Negative inset to prevent blurry edges
              backgroundImage: "url(/icon-512x512.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(20px) brightness(0.2)",
              zIndex: -1,
            }}
          />

          {/* App Icon */}
          <div
            style={{
              width: "140px",
              height: "140px",
              backgroundImage: "url(/icon-512x512.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: "28px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />

          {/* App Title */}
          <h1
            style={{
              color: "#ffffff",
              fontSize: "2rem",
              fontWeight: 800,
              margin: "0.5rem 0 0.5rem 0",
              textShadow: "0 2px 10px rgba(0,0,0,0.8)",
              letterSpacing: "0.02em",
            }}
          >
            Edy on Bike
          </h1>

          {/* Rotation instruction icon block */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
              marginTop: "2rem",
            }}
          >
            <style>{`
              @keyframes tiltPhoneAnim {
                0% { transform: rotate(0deg); }
                20% { transform: rotate(-90deg); }
                60% { transform: rotate(-90deg); }
                80% { transform: rotate(0deg); }
                100% { transform: rotate(0deg); }
              }
            `}</style>

            {/* Animated Phone Icon ONLY */}
            <div style={{ animation: "tiltPhoneAnim 2.5s infinite ease-in-out", transformOrigin: "center" }}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 72 72"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ opacity: 0.9 }}
              >
                {/* Phone outline */}
                <rect
                  x="22"
                  y="8"
                  width="28"
                  height="48"
                  rx="5"
                  stroke="#ffffff"
                  strokeWidth="3"
                  fill="none"
                />
                <circle cx="36" cy="50" r="2.5" fill="#ffffff" />
              </svg>
            </div>

            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  color: "#ffffff",
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: "0.03em",
                  textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                }}
              >
                Please rotate your device
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  margin: "0.25rem 0 0 0",
                  textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                }}
              >
                Edy rides best in landscape
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
