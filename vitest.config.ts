/**
 * Unit tests for the pure game, server and lib modules (`npm test`). Tests sit next to
 * the code they cover as `*.test.ts`; nothing here needs a DOM or a canvas.
 */
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    include: ["{game,lib,party,hooks}/**/*.test.ts"],
    environment: "node",
  },
});
