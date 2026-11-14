"use client";

/**
 * Quick-play search: owns the short-lived socket to the matchmaker (party/matchmaker.ts),
 * projects its status messages onto the waiting screen's state and hands the matched
 * room over to the caller. Kept apart from useMultiplayerRoom so the room socket code
 * stays about rooms, and so a failed match can simply search again with the same name
 * and skin.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { MatchmakerClientMessage, MatchmakerServerMessage } from "@/game/multiplayer/protocol";
import type { SkinId } from "@/game/types";
import { matchmakerUrl } from "@/lib/multiplayerConfig";
import { parseServerMessage } from "@/game/multiplayer/parseServerMessage";

/** Where a quick-play search stands, for the waiting screen. */
export interface QuickPlayQueue {
  /** Riders in the queue, including this one. */
  waiting: number;
  /** Local Date.now() when the current wait ends, or null while nothing is counting down. */
  deadlineAt: number | null;
  /** The wait ran out with nobody else around — time to offer alternatives. */
  lonely: boolean;
  /** A room was assigned; joining it now. */
  matched: boolean;
}

/** Name and skin the rider searched with, so a failed match or Play Again can re-queue without asking. */
export interface QuickPlayParams {
  name: string;
  skinId: SkinId;
}

/** The room the matchmaker assigned, with the params to join it. */
export interface QuickPlayMatch extends QuickPlayParams {
  roomCode: string;
  /** How many riders were matched into the room (the room waits for them before starting). */
  expected: number;
}

export interface MatchmakerCallbacks {
  /** A room was assigned: connect to it with intent "quick". */
  onMatched: (match: QuickPlayMatch) => void;
  /** The search can't start or was cut off; shown to the player. */
  onError: (message: string) => void;
}

/**
 * Runs the quick-play search. `search` opens a matchmaker socket and queues; `searchAgain`
 * repeats the last search (after a match that fell through, or Play Again); `cancel` leaves
 * the queue. The callbacks are read through a ref, so the caller may pass fresh closures on
 * every render without re-creating the socket handlers.
 * @param host - The multiplayer Worker host, or null when this build has none.
 * @example
 * const matchmaker = useMatchmaker(MULTIPLAYER_HOST, { onMatched: (m) => connect(m.roomCode, ...), onError: setError });
 * matchmaker.search("Edy", "default");
 */
export function useMatchmaker(host: string | null, callbacks: MatchmakerCallbacks) {
  const [queue, setQueue] = useState<QuickPlayQueue | null>(null);
  /** The matchmaker socket while searching; cleared before an intentional close so onclose knows. */
  const socketRef = useRef<WebSocket | null>(null);
  const paramsRef = useRef<QuickPlayParams | null>(null);
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  /** Leaves the queue (or just clears the waiting screen once a matched room has been joined). */
  const cancel = useCallback(() => {
    const mm = socketRef.current;
    socketRef.current = null;
    mm?.close();
    setQueue(null);
  }, []);

  /**
   * Joins the quick-play queue. The matchmaker answers with a room code once 2–4 riders
   * are grouped (see QUICK_PLAY_WAIT_MS), and the race in that room starts on its own.
   * @returns Whether a search started (false while one is already running, or without a host).
   */
  const search = useCallback((name: string, skinId: SkinId): boolean => {
    if (socketRef.current) return false;
    if (!host) {
      callbacksRef.current.onError("Multiplayer isn't available right now.");
      return false;
    }
    paramsRef.current = { name, skinId };
    setQueue({ waiting: 1, deadlineAt: null, lonely: false, matched: false });

    const mm = new WebSocket(matchmakerUrl(host));
    socketRef.current = mm;
    let opened = false;

    mm.onopen = () => {
      opened = true;
      const msg: MatchmakerClientMessage = { type: "queue" };
      mm.send(JSON.stringify(msg));
    };

    mm.onmessage = (event) => {
      const msg = parseServerMessage<MatchmakerServerMessage>(event.data);
      if (!msg) return;
      switch (msg.type) {
        case "queue_status":
          setQueue((prev) => prev && {
            ...prev,
            waiting: msg.waiting,
            deadlineAt: msg.msLeft === null ? null : Date.now() + msg.msLeft,
          });
          break;
        case "queue_lonely":
          setQueue((prev) => prev && { ...prev, lonely: true });
          break;
        case "matched":
          // The socket's job is done; the waiting screen stays up until the room confirms the join
          socketRef.current = null;
          mm.close();
          setQueue((prev) => prev && { ...prev, matched: true, deadlineAt: null });
          callbacksRef.current.onMatched({ roomCode: msg.roomCode, expected: msg.expected, name, skinId });
          break;
      }
    };

    mm.onclose = () => {
      if (socketRef.current !== mm) return; // cancelled or matched
      socketRef.current = null;
      setQueue(null);
      callbacksRef.current.onError(
        opened
          ? "Lost connection while finding riders. Try Quick Play again."
          : "Couldn't reach the multiplayer server. Check your connection and try again."
      );
    };

    mm.onerror = () => {
      console.error(`[Multiplayer] WebSocket error connecting to the matchmaker on ${host}`);
    };
    return true;
  }, [host]);

  /**
   * Repeats the last search, e.g. after a matched room fell through.
   * @returns Whether a search started (see `search`); false if there was nothing to repeat.
   */
  const searchAgain = useCallback((): boolean => {
    const params = paramsRef.current;
    return params ? search(params.name, params.skinId) : false;
  }, [search]);

  // Leaving the page must drop the queue, or the matchmaker would match a rider who is gone
  useEffect(() => cancel, [cancel]);

  return { queue, search, searchAgain, cancel };
}
