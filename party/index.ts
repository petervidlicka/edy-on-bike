/**
 * Cloudflare Worker entry point for multiplayer. Routes WebSocket upgrades on
 * /parties/race/<room code> to that room's Durable Object (MultiplayerServer);
 * anything else is a 404.
 */
import { routePartykitRequest } from "partyserver";

export { MultiplayerServer } from "./server";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (await routePartykitRequest(request, env)) ?? new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
