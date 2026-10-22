/**
 * Quick-play matchmaker: a single PartyServer Durable Object (clients always connect
 * to /parties/matchmaker/global) that groups waiting riders and hands each group a
 * fresh room code. The race itself runs in a normal MultiplayerServer room (server.ts),
 * which the matched clients join with intent "quick".
 *
 * This class is only the I/O glue: it owns the sockets, the message budgets and the
 * deadline timer, and feeds every event into a QueuePolicy (queuePolicy.ts), which
 * decides who gets matched when and hands back the messages, closes and timer to apply.
 */
import { Server, type Connection, type ConnectionContext } from "partyserver";
import { MESSAGE_BURST, MESSAGE_RATE_PER_SEC, TokenBucket } from "./validation";
import { closeUnlessBy, parseIncoming } from "./socket";
import { QUEUE_TIMEOUT_MS, QueuePolicy, type QueueEffects } from "./queuePolicy";

/** Only message the matchmaker accepts; anything bigger is junk. */
const MAX_MESSAGE_CHARS = 64;

/** Socket and timer glue around one QueuePolicy; see queuePolicy.ts for the matching rules. */
export class Matchmaker extends Server {
  /** The deadline timer lives in memory, so stay resident while anyone is queued. */
  static options = { hibernate: false };

  readonly policy = new QueuePolicy();
  /** Every registered socket by id, so the policy's effects can be delivered. */
  sockets: Map<string, Connection> = new Map();
  /** Per-socket message budget, checked before parsing — the same budget a room socket gets. */
  messageLimits: WeakMap<Connection, TokenBucket> = new WeakMap();
  deadlineTimer: ReturnType<typeof setTimeout> | null = null;

  onConnect(conn: Connection, ctx: ConnectionContext) {
    const ip = ctx.request.headers.get("cf-connecting-ip") ?? "unknown";
    const fx = this.policy.connect(conn.id, ip);
    if (fx.closes.length > 0) {
      this.dispatch(fx, conn);
      return;
    }
    this.sockets.set(conn.id, conn);
    this.messageLimits.set(conn, new TokenBucket(MESSAGE_RATE_PER_SEC, MESSAGE_BURST, Date.now()));
    closeUnlessBy(conn, QUEUE_TIMEOUT_MS, () => this.policy.isSettled(conn.id), "Queue timeout");
  }

  onMessage(sender: Connection, message: string | ArrayBuffer | ArrayBufferView) {
    if (typeof message !== "string" || message.length > MAX_MESSAGE_CHARS) return;
    if (!this.messageLimits.get(sender)?.take(Date.now())) return; // flooding — drop unparsed
    const parsed = parseIncoming(message, MAX_MESSAGE_CHARS);
    if (!parsed || parsed.type !== "queue") return;
    this.dispatch(this.policy.enqueue(sender.id, Date.now()), sender);
  }

  onClose(conn: Connection) {
    this.sockets.delete(conn.id);
    this.dispatch(this.policy.close(conn.id, Date.now()));
  }

  /**
   * Delivers a transition's messages, closes and timer change, in that order (a matched
   * socket gets its room code before it is closed).
   * @param sender - The socket whose event caused this, so a close can reach it before registration.
   */
  private dispatch(fx: QueueEffects, sender?: Connection) {
    for (const out of fx.outbox) {
      this.socketFor(out.to, sender)?.send(JSON.stringify(out.msg));
    }
    for (const close of fx.closes) {
      this.socketFor(close.id, sender)?.close(close.code, close.reason);
    }
    for (const intent of fx.timers) {
      if (this.deadlineTimer) clearTimeout(this.deadlineTimer);
      this.deadlineTimer = null;
      if (intent.kind === "schedule") {
        this.deadlineTimer = setTimeout(() => {
          this.deadlineTimer = null;
          this.dispatch(this.policy.onDeadline(Date.now()));
        }, intent.inMs);
      }
    }
  }

  private socketFor(id: string, sender?: Connection): Connection | undefined {
    return this.sockets.get(id) ?? (sender?.id === id ? sender : undefined);
  }
}
