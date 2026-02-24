# Edy on Bike - AI Agent Guardrails & Context

## 1. Tech Stack & Project Identity
* **Core:** Next.js (App Router, v16+), React (v19+), TypeScript.
* **Styling:** Tailwind CSS (v4).
* **Backend/State:** Upstash (Redis/Rate Limiting) for leaderboards.
* **Game Engine:** Custom HTML5 `<canvas>` rendering and custom physics. No external physics libraries are used.

## 2. Architecture & File Structure
* **`/app/`:** Next.js App Router files, global CSS, and API routes (e.g., `/api/leaderboard`).
* **`/components/`:** Functional React UI components (`GameCanvas.tsx`, `HUD.tsx`, `StartScreen.tsx`).
* **`/game/`:** Core game logic and engine.
* **`/game/environments/`:** Biome configurations and definitions.
* **`/data/` & `/lib/`:** Server-side logic, database connections, and static data.

## 3. Coding Style & Paradigms
This project uses a strict Hybrid approach to separate UI from the 60fps game loop:
* **UI Layer:** Pure Functional React components.
* **Game Engine Core:** Object-Oriented Programming (OOP) for the top-level managers (`Engine.ts`, `EnvironmentManager.ts`, `SoundManager.ts`). These classes hold state and expose lifecycle methods (`update()`, `render()`).
* **Game Entities:** Data-Oriented/Functional design. Avoid heavy OOP for entities like the Player or Obstacles. Use naked data objects (e.g., `PlayerState`) passed to pure/stateless functional helpers (e.g., `updatePlayer(playerState, dt)`).
* **Commenting & Documentation:** Always include detailed inline comments explaining the *why* and *how* behind complex game logic, physics calculations, and animation/rendering sequences.

## 4. Naming Conventions
* **camelCase:** Variables, instances, and functions (e.g., `createPlayer`, `groundY`).
* **PascalCase:** Classes, Interfaces, Types, and React Components (e.g., `PlayerState`, `GameCanvas`).
* **UPPER_SNAKE_CASE:** Global constants (e.g., `MIN_OBSTACLE_GAP`, `PLAYER_WIDTH`).

## 5. Performance Guardrails (CRITICAL)
* The game must maintain a strict 60fps.
* **Memory Management:** Minimize object creation and memory allocation inside the main `update()` and `render()` loops to prevent Garbage Collection (GC) stutters. Reuse objects or use object pooling where possible.
* **AI Requirement:** If an architectural change or new feature could negatively impact performance or cause GC spikes, you MUST explicitly point this out in your response before writing the code.