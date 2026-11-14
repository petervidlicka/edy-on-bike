# edy-on-bike

2D side scroller game for my son Edy.

Built with Next.js, React, TypeScript and HTML5 Canvas, with a Cloudflare Worker for multiplayer and Capacitor for the iOS and Android apps.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and press **Space** to start. Jump and double-jump to avoid obstacles, and chain tricks for combos.

## Project layout

| Path | What's there |
|---|---|
| `game/` | Engine, physics, tricks, crashes, biomes (`environments/`) and canvas rendering |
| `components/`, `hooks/` | React UI around the canvas (start, HUD, pause, game over, multiplayer) |
| `app/api/leaderboard/` | Leaderboard API (Upstash Redis in production, a local file in dev) |
| `party/` | Multiplayer server (Cloudflare Worker), see [MULTIPLAYER.md](MULTIPLAYER.md) |
| `android/`, `ios/` | Capacitor native projects, see [PLAN.md](PLAN.md) |

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm run lint` / `npx tsc --noEmit` | Checks to run before committing (CI runs the same on every PR, plus the Worker's `npm run typecheck`) |
| `npm test` | Unit tests (Vitest) for the pure modules: combos, tricks, collisions, score bounds, names, multiplayer validation |
| `cd party && npm run dev` | Local multiplayer server on port 8787 |
| `npm run build:mobile` | Static export for the native apps (env from `.env.capacitor`) + `cap sync` |
| `npm run voice:manifest` | Regenerates the voice-clip manifest |

## Environment

Copy `.env.local.example` to `.env.local`. Nothing is required for local dev. Production needs the Upstash Redis credentials (leaderboard) and `NEXT_PUBLIC_MULTIPLAYER_HOST` (multiplayer); see the example file and [MULTIPLAYER.md](MULTIPLAYER.md).
