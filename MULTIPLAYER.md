# Multiplayer Setup Guide

Multiplayer runs on a small **Cloudflare Worker** in `party/` ([PartyServer](https://www.npmjs.com/package/partyserver) on Durable Objects — one instance per room code, plus one global quick-play matchmaker), separately from the Next.js app on Vercel.

## Prerequisites

- Node.js 18+
- npm
- For deploying only: a (free) Cloudflare account

## Quick Start (Local Development)

You need **two terminals** running simultaneously:

### Terminal 1 — Next.js App

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

### Terminal 2 — Multiplayer Server

```bash
cd party
npm install
npm run dev
```

The Worker runs locally (no Cloudflare account needed) at `http://localhost:8787`.

Open `http://localhost:3000/multiplayer` in your browser to play.

## How It Works

### Quick Play (default)

1. **Quick Play** — enter your name, pick a skin, click "QUICK PLAY". You join a single global queue (`party/matchmaker.ts`).
2. **Matching** — the first rider in the queue starts a 15-second wait. When it ends, everyone queued (2–4 riders) is sent to a fresh room with a code like `Q7KX2M`; a 4th rider matches immediately.
3. **Nobody around** — if the wait ends with only you, you're offered Keep waiting / Ride solo / Back. You stay queued; the next rider to arrive gets a 5-second wait for others, then you race.
4. **Race** — matchmade rooms skip READY: the countdown starts once every matched rider has connected (or after 5 seconds with whoever made it; a lone rider, or a matched rider who connects after that, is quietly re-queued).
5. **Play Again** searches again rather than reusing the room — strangers rarely all stay for a rematch.

### Rooms with friends

1. **Create a room** — enter your name, pick a skin, click "CREATE ROOM". You get a 4-character room code.
2. **Share the code** — other players go to `/multiplayer`, enter the code, and click "JOIN".
3. **Ready up** — each player clicks "READY". The race starts when all players (minimum 2) are ready.
4. **Race** — everyone sees the same obstacles (seeded RNG, independent of screen size). Other players appear as semi-transparent ghosts, each in its own lane so bikes don't overlap.
5. **Crash** — when you crash, your ghost fades out for everyone else. The race ends when every player has crashed, left, or gone silent for 10 seconds (e.g. a hidden tab). Rankings are displayed.
6. **Play Again** — returns you to the same room's lobby; the next race starts once everyone still in the room is ready again.

### Trick boost

Landing a trick pushes your rider forward across the screen (bigger tricks and combos push further), so the rider on a roll visibly pulls ahead. It caps at 48% of the screen width, holds for 10 seconds after your last trick, then eases back to the start position. It only moves your screen position — world speed is unchanged, so the course stays fair; the cost is less warning before obstacles. Tuning lives in `game/multiplayer/TrickBoost.ts`, ghost lanes in `GhostPlayerRenderer.ts`.

Clients connect to `wss://<host>/parties/race/<ROOM CODE>` for rooms and `wss://<host>/parties/matchmaker/global` for quick play (paths come from the `Race` and `Matchmaker` Durable Object bindings in `party/wrangler.jsonc`).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_MULTIPLAYER_HOST` | `localhost:8787` in `next dev`; unset in production | Host of the multiplayer Worker |

For local dev you don't need to set anything — it defaults to `localhost:8787`.

In a **production build without the variable, multiplayer is hidden** (the start-screen button doesn't render), so a missing config never points players at their own `localhost`. It's a `NEXT_PUBLIC_` variable, so it's baked in at **build time** — set it before building, not just at runtime.

## Production Deployment

### Deploy the Worker

```bash
cd party
npx wrangler login   # once, opens Cloudflare in your browser
npm run deploy
```

This prints a URL like `https://edy-on-bike-multiplayer.<your-subdomain>.workers.dev`. The host part (without `https://`) is the value for `NEXT_PUBLIC_MULTIPLAYER_HOST`. Logs are in the Cloudflare dashboard under Workers → edy-on-bike-multiplayer.

The client uses `wss://` (secure WebSocket) for everything except localhost and private-network IPs (`192.168.x.x` etc.), which use `ws://` so you can test from a phone on the same Wi-Fi.

### Deploy Next.js (web)

Set `NEXT_PUBLIC_MULTIPLAYER_HOST` in the Vercel project's environment variables, then redeploy so the build picks it up.

### Native apps (Capacitor)

The mobile build is a static export, so pass the host when building:

```bash
NEXT_PUBLIC_MULTIPLAYER_HOST=edy-on-bike-multiplayer.<your-subdomain>.workers.dev npm run build:mobile
```

Without it, the native app ships with multiplayer hidden.

### Changing the Worker

- `npm run typecheck` (in `party/`) type-checks the Worker; the root `tsconfig.json` excludes `party/`.
- After editing `wrangler.jsonc`, run `npm run types` to regenerate `worker-configuration.d.ts`.
- Renaming, adding or removing a Durable Object class needs a **new** entry in `migrations` — never edit an existing one.

## Limits

- Max **4 players** per room
- Racers who send no updates for **10 seconds** are counted as crashed
- Rooms auto-close after **5 minutes** with no messages from any joined player; sockets that don't join within **10 seconds** are closed
- If a player leaves during the countdown and only one is left, the room goes back to the lobby (quick play re-queues the remaining rider)
- Names are 1–16 characters; scores are sanity-checked server-side (bounded, not fully cheat-proof)

### Abuse protection

- Connection ids are always generated by the server: the Worker refuses PartyServer's `?_pk=` id override, and every room handler checks that a message (or close) comes from the exact socket that joined as that player
- Room codes must have the shape the clients generate (4 characters for friend rooms, `Q` + 5 for quick play); a new room landing on a code already in use is retried with a fresh code
- Every socket has a message budget (30/s, burst 40); snapshots are limited to 20/s (burst 6), and a snapshot whose timestamp goes backwards or jumps ahead of the server clock is dropped
- Matchmaker, per IP: at most 4 open sockets, 2 queued riders and 10 matches per 2 minutes. Matched sockets are closed by the server, and sockets that don't queue within 10 seconds are dropped

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Couldn't reach the multiplayer server" | Make sure the Worker is running (`cd party && npm run dev`); the browser console logs the host it tried |
| No MULTIPLAYER button in a production build | `NEXT_PUBLIC_MULTIPLAYER_HOST` wasn't set when the app was built |
| "No room found with code …" | Nobody is in that room — check the code, or create a new room |
| "That room is full" | Max 4 players — create a new room |
| "That race has already started" | Wait for the race to end, or create a new room |
| Ghost players jittering | Ghosts render ~100ms behind real time to absorb jitter; very unstable connections can still stutter |
