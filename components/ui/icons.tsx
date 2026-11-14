/**
 * Line icons for the HUD controls. Inline SVGs on `currentColor`, so they take the
 * colour of the button they sit in and need no icon font or image requests.
 */

/** Musical note; struck through while muted. */
export function MusicIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      {muted && <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.5" />}
    </svg>
  );
}

/** Speaker with sound waves, or a cross while muted. */
export function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      aria-hidden="true"
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

/** Buzzing phone; struck through while vibration is off. */
export function VibrationIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="4" width="8" height="16" rx="1.5" />
      <path d="M4 8v8M20 8v8" />
      {off && <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.5" />}
    </svg>
  );
}

/** Two filled bars. */
export function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
