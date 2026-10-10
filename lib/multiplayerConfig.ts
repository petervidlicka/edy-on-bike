/**
 * Multiplayer (PartyKit) connection settings shared by the start screen and the
 * room hook. Client-safe: it only reads NEXT_PUBLIC_ variables, which Next inlines
 * at build time — so web (Vercel) and native (Capacitor) builds each bake in their own.
 */

/**
 * PartyKit host, e.g. "edy-on-bike.<user>.partykit.dev". Development falls back to
 * the local `partykit dev` server; a production build without the variable gets null,
 * so multiplayer is hidden rather than pointing players at their own localhost.
 */
export const PARTYKIT_HOST: string | null =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ||
  (process.env.NODE_ENV === "development" ? "localhost:1999" : null);

/** Whether this build can reach a multiplayer server — gates the entry points. */
export const isMultiplayerEnabled = PARTYKIT_HOST !== null;

/** Loopback and private-network hosts are `partykit dev` without TLS. */
const LOCAL_HOST =
  /^(localhost|\[::1\]|127(\.\d{1,3}){3}|10(\.\d{1,3}){3}|192\.168(\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2}|[\w-]+\.local)(:\d+)?$/;

/**
 * Builds the WebSocket URL for a room. Local/LAN hosts (testing on a phone over
 * Wi-Fi included) use ws://; everything else uses wss://, which iOS requires.
 * @example partyKitUrl("192.168.0.5:1999", "AB12") // "ws://192.168.0.5:1999/party/AB12"
 */
export function partyKitUrl(host: string, roomCode: string): string {
  const protocol = LOCAL_HOST.test(host) ? "ws" : "wss";
  return `${protocol}://${host}/party/${roomCode}`;
}
