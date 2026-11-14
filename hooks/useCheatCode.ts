/**
 * Classic typed cheat codes (IDKFA, IDDQD) for the single-player screen.
 */
import { useRef, useEffect } from "react";
import { isTyping } from "@/lib/dom";

/**
 * Calls `onActivate` when `code` is typed anywhere on the page except into a text field,
 * so a name like "Idkfan" in the leaderboard form can't trigger it.
 * @param code - Uppercase letters to listen for.
 * @example useCheatCode("IDDQD", enableGodMode);
 */
export function useCheatCode(code: string, onActivate: () => void): void {
  const bufferRef = useRef("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      bufferRef.current += e.key.toUpperCase();
      if (bufferRef.current.length > code.length) {
        bufferRef.current = bufferRef.current.slice(-code.length);
      }
      if (bufferRef.current === code) {
        bufferRef.current = "";
        onActivate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [code, onActivate]);
}
