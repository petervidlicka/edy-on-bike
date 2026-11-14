/**
 * Socket plumbing shared by the room (server.ts) and matchmaker (matchmaker.ts) Durable
 * Objects: decoding client frames, encoding replies and dropping sockets that never get
 * past their first message. Kept apart from the room/queue logic so both classes treat a
 * socket the same way and the untrusted-input rules live in one place.
 */
import type { Connection } from "partyserver";

/**
 * Decodes one client frame into a plain object. Binary frames, oversized frames, invalid
 * JSON and non-object payloads are all dropped as null: our clients send none of those,
 * so nothing deserves a reply and the caller just ignores the frame.
 * @param raw - The frame as PartyServer hands it to onMessage.
 * @param maxChars - Longest text frame worth parsing; anything bigger is junk or a flood.
 * @returns The decoded object (every field still untrusted), or null to ignore the frame.
 */
export function parseIncoming(
  raw: string | ArrayBuffer | ArrayBufferView,
  maxChars: number,
): Record<string, unknown> | null {
  if (typeof raw !== "string" || raw.length > maxChars) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
}

/** JSON-encodes one message for one socket. */
export function sendJson(conn: Connection, msg: object): void {
  conn.send(JSON.stringify(msg));
}

/**
 * Closes `conn` with 1008 (policy violation) after `ms` unless it has settled by then. Idle
 * sockets that connect and never join or queue would otherwise keep a Durable Object resident.
 * @param isSettled - Checked when the timer fires: true if the socket did what it came for.
 */
export function closeUnlessBy(conn: Connection, ms: number, isSettled: () => boolean, reason: string): void {
  setTimeout(() => {
    if (!isSettled()) conn.close(1008, reason);
  }, ms);
}
