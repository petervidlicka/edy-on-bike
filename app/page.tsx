"use client";

/** Single-player game: the whole home route is the canvas and its overlays. */
import { GameCanvas } from "@/components/GameCanvas";
import { OrientationGuard } from "@/components/OrientationGuard";

/** Home route (default export required by Next.js). */
export default function Home() {
  return (
    <OrientationGuard>
      <GameCanvas />
    </OrientationGuard>
  );
}
