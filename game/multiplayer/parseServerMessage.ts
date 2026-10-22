/**
 * Decodes one WebSocket frame from the multiplayer Worker, shared by the room and
 * matchmaker hooks. A malformed frame (bad deploy, proxy noise) is logged and dropped
 * rather than throwing inside onmessage and wedging the room.
 */

/**
 * @param data - The frame's `event.data`.
 * @returns The message, trusted to carry a `type` tag, or null to ignore the frame.
 * @example
 * const msg = parseServerMessage<ServerMessage>(event.data);
 * if (msg?.type === "race_start") ...
 */
export function parseServerMessage<M extends { type: string }>(data: unknown): M | null {
  if (typeof data !== "string") {
    console.error("[Multiplayer] Ignoring non-text message from server");
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(data);
    if (typeof parsed === "object" && parsed !== null && "type" in parsed) {
      return parsed as M;
    }
    console.error("[Multiplayer] Ignoring server message without a type:", data);
  } catch (err) {
    console.error("[Multiplayer] Ignoring malformed server message:", err);
  }
  return null;
}
