/**
 * Multiplayer room server: a PartyServer Durable Object on Cloudflare, one
 * instance per room code (see index.ts for routing, wrangler.jsonc for config).
 * Runs separately from the Next.js app — see MULTIPLAYER.md for dev/deploy.
 *
 * This class is only the I/O glue: it owns the sockets, the message budgets and the
 * timers, and feeds every event into a RoomState (roomState.ts), which decides what
 * happens and hands back the messages to deliver and the timers to (re)arm.
 */
import { Server, type Connection } from "partyserver";
import { closeUnlessBy, parseIncoming } from "./socket";
import { MAX_MESSAGE_CHARS, MESSAGE_BURST, MESSAGE_RATE_PER_SEC, TokenBucket } from "./validation";
import { RoomState, type RoomEffects, type RoomTimerId } from "./roomState";
import { MAX_PLAYERS, isFriendRoomCode, isQuickPlayCode } from "../game/multiplayer/protocol";
import type { ClientMessage } from "../game/multiplayer/protocol";

// ── Types ──────────────────────────────────────────────────────────────

/**
 * A ClientMessage as it comes off the wire: the `type` tag is trusted for
 * dispatch, every payload field is `unknown` until validation.ts has checked it.
 */
type Untrusted<M> = M extends { type: infer T }
  ? { type: T } & { [K in Exclude<keyof M, "type">]: unknown }
  : never;

type IncomingMessage = Untrusted<ClientMessage>;

// ── Limits ─────────────────────────────────────────────────────────────

/** A socket that hasn't joined by now is closed, so idle sockets can't keep a room resident. */
const JOIN_TIMEOUT_MS = 10_000;
/** Rooms close every socket after this long without a message from a joined player. */
const INACTIVITY_MS = 5 * 60 * 1000;
/**
 * Sockets connected but not (yet) joined. Real clients join within a round trip, so a
 * handful covers simultaneous arrivals; more is someone opening sockets to hold the room.
 */
const MAX_PENDING_SOCKETS = MAX_PLAYERS * 2;

// ── Server ─────────────────────────────────────────────────────────────

/** Socket and timer glue around one RoomState; see roomState.ts for the room rules. */
export class MultiplayerServer extends Server {
  /**
   * No hibernation: room state and the countdown/stale-check timers live in memory,
   * so the Durable Object must stay resident while players are connected.
   */
  static options = { hibernate: false };

  /** Created on first use: `this.name` (the room code) isn't known at construction. */
  private roomState: RoomState | null = null;
  /** Joined players' sockets only — spectators that never sent "join" aren't broadcast to. */
  connections: Map<string, Connection> = new Map();
  /** Per-socket message budget, checked before parsing (joined or not). */
  messageLimits: WeakMap<Connection, TokenBucket> = new WeakMap();
  inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  /** The room's armed timers, at most one per id (see TimerIntent). */
  private readonly timers: Map<RoomTimerId, ReturnType<typeof setTimeout>> = new Map();

  private get room(): RoomState {
    return (this.roomState ??= new RoomState(this.name));
  }

  onConnect(conn: Connection) {
    // Only codes the client could have produced host rooms; anything else is a probe
    if (!isFriendRoomCode(this.name) && !isQuickPlayCode(this.name)) {
      conn.close(1008, "Invalid room code");
      return;
    }
    // PartyServer has already registered `conn`, so count the *other* pending sockets
    if (this.pendingSocketCount() - 1 >= MAX_PENDING_SOCKETS) {
      conn.close(1013, "Too many connections");
      return;
    }

    // Don't add as player yet — wait for "join" message. PartyServer tracks the
    // socket internally; we add it to our map only after a successful join.
    this.messageLimits.set(conn, new TokenBucket(MESSAGE_RATE_PER_SEC, MESSAGE_BURST, Date.now()));
    closeUnlessBy(conn, JOIN_TIMEOUT_MS, () => this.isPlayerSocket(conn), "Join timeout");
  }

  onMessage(sender: Connection, message: string | ArrayBuffer | ArrayBufferView) {
    if (typeof message !== "string" || message.length > MAX_MESSAGE_CHARS) return;
    const now = Date.now();
    if (!this.messageLimits.get(sender)?.take(now)) return; // flooding — drop unparsed

    const data = parseIncoming(message, MAX_MESSAGE_CHARS) as IncomingMessage | null;
    if (!data) return;

    if (data.type === "join") {
      const fx = this.room.join(sender.id, {
        name: data.name,
        skinId: data.skinId,
        intent: data.intent,
        expected: data.expected,
      });
      if (this.room.hasPlayer(sender.id)) {
        this.connections.set(sender.id, sender);
        this.resetInactivityTimer();
      }
      this.dispatch(fx, sender);
      return;
    }

    // Everything else must come from the socket that joined as this player. Connection ids
    // are only trusted for sockets in our own map (see index.ts for why ids can't be chosen).
    if (!this.isPlayerSocket(sender)) return;
    // Only joined players keep the room alive; idle sockets can't hold it open
    this.resetInactivityTimer();

    switch (data.type) {
      case "ready":
        this.dispatch(this.room.ready(sender.id));
        break;
      case "player_update":
        this.dispatch(this.room.playerUpdate(sender.id, data.snapshot, now));
        break;
      case "player_crashed":
        this.dispatch(this.room.playerCrashed(sender.id, data.score, now));
        break;
      case "rematch":
        this.dispatch(this.room.rematch(sender.id));
        break;
      case "leave":
        // Dropped from the broadcast set first: the leaver doesn't need its own player_left
        this.connections.delete(sender.id);
        this.dispatch(this.room.leave(sender.id));
        break;
    }
  }

  onClose(conn: Connection) {
    // A socket that never joined (or a stale duplicate) must not remove the player with its id
    if (!this.isPlayerSocket(conn)) return;
    this.connections.delete(conn.id);
    this.dispatch(this.room.disconnect(conn.id));
  }

  // ── Effects ──────────────────────────────────────────────────────────

  /**
   * Delivers a transition's messages and (re)arms its timers.
   * @param sender - The socket whose message caused this, so "one" can reach it before it has joined.
   */
  private dispatch(fx: RoomEffects, sender?: Connection) {
    for (const out of fx.outbox) {
      const raw = JSON.stringify(out.msg);
      switch (out.to) {
        case "all":
          for (const conn of this.connections.values()) conn.send(raw);
          break;
        case "others":
          for (const [id, conn] of this.connections) {
            if (id !== out.except) conn.send(raw);
          }
          break;
        case "one": {
          const conn = this.connections.get(out.id) ?? (sender?.id === out.id ? sender : undefined);
          conn?.send(raw);
          break;
        }
      }
    }
    for (const intent of fx.timers) {
      const armed = this.timers.get(intent.id);
      if (armed) clearTimeout(armed);
      this.timers.delete(intent.id);
      if (intent.kind === "schedule") {
        const { id } = intent;
        this.timers.set(id, setTimeout(() => {
          this.timers.delete(id);
          this.dispatch(this.room.onTimer(id, Date.now()));
        }, intent.inMs));
      }
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  /**
   * Whether this socket is the one that joined as `conn.id`. Every handler but join keys on
   * the connection id, so this is what ties a message (or a close) to the right player.
   */
  private isPlayerSocket(conn: Connection): boolean {
    return this.connections.get(conn.id) === conn;
  }

  /** Open sockets that haven't joined as a player. */
  private pendingSocketCount(): number {
    return Array.from(this.getConnections()).length - this.connections.size;
  }

  private resetInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    // Close every socket, not just joined players — a socket that connects and
    // never sends "join" would otherwise stay open (and keep the room alive) forever.
    this.inactivityTimer = setTimeout(() => {
      this.inactivityTimer = null;
      for (const conn of this.getConnections()) {
        conn.close();
      }
    }, INACTIVITY_MS);
  }
}
