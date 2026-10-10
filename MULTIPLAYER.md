# Multiplayer Setup Guide

## Prerequisites

- Node.js 18+
- npm

## Quick Start (Local Development)

You need **two terminals** running simultaneously:

### Terminal 1 — Next.js App

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

### Terminal 2 — PartyKit Server

```bash
cd party
npm install
npx partykit dev
```

PartyKit runs at `http://localhost:1999`.

Open `http://localhost:3000/multiplayer` in your browser to play.

## How It Works

1. **Create a room** — enter your name, pick a skin, click "CREATE ROOM". You get a 4-character room code.
2. **Share the code** — other players go to `/multiplayer`, enter the code, and click "JOIN".
3. **Ready up** — each player clicks "READY". The race starts when all players (minimum 2) are ready.
4. **Race** — everyone sees the same obstacles (seeded RNG, independent of screen size). Other players appear as semi-transparent ghosts.
5. **Crash** — when you crash, your ghost fades out for everyone else. The race ends when every player has crashed, left, or gone silent for 10 seconds (e.g. a hidden tab). Rankings are displayed.
6. **Play Again** — returns you to the same room's lobby; the next race starts once everyone still in the room is ready again.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_PARTYKIT_HOST` | `localhost:1999` in `next dev`; unset in production | PartyKit server host |

For local dev you don't need to set anything — it defaults to `localhost:1999`.

In a **production build without the variable, multiplayer is hidden** (the start-screen button doesn't render), so a missing config never points players at their own `localhost`. It's a `NEXT_PUBLIC_` variable, so it's baked in at **build time** — set it before building, not just at runtime.

## Production Deployment

### Deploy PartyKit

```bash
cd party
npx partykit deploy
```

This deploys to PartyKit's hosting and gives you a URL like `my-app.USERNAME.partykit.dev`.

### Set the Environment Variable

Point your Next.js app at the deployed PartyKit server:

```bash
NEXT_PUBLIC_PARTYKIT_HOST=my-app.USERNAME.partykit.dev
```

The client uses `wss://` (secure WebSocket) for everything except localhost and private-network IPs (`192.168.x.x` etc.), which use `ws://` so you can test from a phone on the same Wi-Fi.

### Deploy Next.js (web)

Set `NEXT_PUBLIC_PARTYKIT_HOST` in the Vercel project's environment variables, then redeploy so the build picks it up.

### Native apps (Capacitor)

The mobile build is a static export, so pass the host when building:

```bash
NEXT_PUBLIC_PARTYKIT_HOST=my-app.USERNAME.partykit.dev npm run build:mobile
```

Without it, the native app ships with multiplayer hidden.

## Limits

- Max **4 players** per room
- Racers who send no updates for **10 seconds** are counted as crashed
- Rooms auto-close after **5 minutes** with no messages from anyone
- Names are 1–16 characters; scores are sanity-checked server-side (bounded, not fully cheat-proof)

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Couldn't reach the multiplayer server" | Make sure the PartyKit dev server is running (`cd party && npx partykit dev`); the browser console logs the host it tried |
| No MULTIPLAYER button in a production build | `NEXT_PUBLIC_PARTYKIT_HOST` wasn't set when the app was built |
| "No room found with code …" | Nobody is in that room — check the code, or create a new room |
| "That room is full" | Max 4 players — create a new room |
| "That race has already started" | Wait for the race to end, or create a new room |
| Ghost players jittering | Ghosts render ~100ms behind real time to absorb jitter; very unstable connections can still stutter |
