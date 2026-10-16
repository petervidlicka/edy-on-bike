/**
 * Transient in-run banner announcing a freshly earned bike. Never intercepts input.
 */

/**
 * @param props - `message` to show; renders nothing when null.
 * @example
 * <UnlockToast message="🔓 Neon Night unlocked!" />
 */
export function UnlockToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: "18%",
        left: "50%",
        transform: "translateX(-50%)",
        pointerEvents: "none",
        zIndex: 20,
        color: "#713f12",
        fontFamily: "var(--font-fredoka), sans-serif",
        fontSize: "1.2rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        background: "rgba(254,240,138,0.55)",
        backdropFilter: "blur(24px) saturate(200%)",
        WebkitBackdropFilter: "blur(24px) saturate(200%)",
        border: "1.5px solid rgba(234,179,8,0.6)",
        borderRadius: "18px",
        padding: "0.5rem 1.5rem",
        boxShadow: "0 2px 20px rgba(0,0,0,0.12), inset 0 1.5px 0 rgba(255,255,255,0.8)",
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  );
}
