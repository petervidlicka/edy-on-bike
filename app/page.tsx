"use client";

import GameCanvas from "@/components/GameCanvas";
import OrientationGuard from "@/components/OrientationGuard";

export default function Home() {
  return (
    <OrientationGuard>
      <GameCanvas />
    </OrientationGuard>
  );
}
