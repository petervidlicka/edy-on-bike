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
4. **Race** — everyone sees the same obstacles (seeded RNG). Other players appear as semi-transparent ghosts.
5. **Crash** — when you crash, your ghost dims out. Race ends when all players have crashed. Rankings are displayed.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_PARTYKIT_HOST` | `localhost:1999` | PartyKit server host |

For local dev you don't need to set anything — it defaults to `localhost:1999`.

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

The client automatically uses `wss://` (secure WebSocket) for non-localhost hosts.

### Deploy Next.js

Deploy the Next.js app as usual (Vercel, etc.) with the `NEXT_PUBLIC_PARTYKIT_HOST` env var set.

## Limits

- Max **4 players** per room
- Rooms auto-close after **5 minutes** of inactivity
- Results screen stays for **5 minutes** after race ends

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Can't connect to room | Make sure the PartyKit dev server is running (`cd party && npx partykit dev`) |
| "Room is full" error | Max 4 players — create a new room |
| Obstacles differ between players | All players must connect before the race starts (the seed is shared at countdown) |
| Ghost players jittering | Normal on high-latency connections — interpolation smooths 100ms of offset |
