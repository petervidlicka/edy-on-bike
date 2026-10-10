/**
 * Multiplayer server connection settings shared by the start screen and the
 * room hook. Client-safe: it only reads NEXT_PUBLIC_ variables, which Next inlines
 * at build time — so web (Vercel) and native (Capacitor) builds each bake in their own.
 */

/**
 * Host of the multiplayer Worker (party/), e.g. "edy-on-bike-multiplayer.<subdomain>.workers.dev".
 * Development falls back to the local `wrangler dev` server; a production build without
 * the variable gets null, so multiplayer is hidden rather than pointing players at their
 * own localhost.
 */
export const MULTIPLAYER_HOST: string | null =
  process.env.NEXT_PUBLIC_MULTIPLAYER_HOST ||
  (process.env.NODE_ENV === "development" ? "localhost:8787" : null);

/** Whether this build can reach a multiplayer server — gates the entry points. */
export const isMultiplayerEnabled = MULTIPLAYER_HOST !== null;

/** Loopback and private-network hosts are `wrangler dev` without TLS. */
const LOCAL_HOST =
  /^(localhost|\[::1\]|127(\.\d{1,3}){3}|10(\.\d{1,3}){3}|192\.168(\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2}|[\w-]+\.local)(:\d+)?$/;

/**
 * Builds the WebSocket URL for a room. Local/LAN hosts (testing on a phone over
 * Wi-Fi included) use ws://; everything else uses wss://, which iOS requires.
 * The path matches the Worker's "Race" Durable Object binding (party/wrangler.jsonc).
 * @example roomUrl("192.168.0.5:8787", "AB12") // "ws://192.168.0.5:8787/parties/race/AB12"
 */
export function roomUrl(host: string, roomCode: string): string {
  const protocol = LOCAL_HOST.test(host) ? "ws" : "wss";
  return `${protocol}://${host}/parties/race/${roomCode}`;
}
