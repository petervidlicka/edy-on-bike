/**
 * Regenerates public/voice/manifest.json from the .mp3 files in public/voice/, so the game
 * knows which voice clips exist. Run after adding or removing clips: `npm run voice:manifest`.
 * File names must follow `<event>[-<variant>]-<n>.mp3` (see public/voice/README.md).
 */
import { readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const voiceDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "voice");
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*-\d+\.mp3$/;

const mp3s = readdirSync(voiceDir).filter((f) => f.endsWith(".mp3"));
const files = mp3s.filter((f) => NAME.test(f)).sort();
for (const bad of mp3s.filter((f) => !NAME.test(f))) {
  console.warn(`skipped ${bad}: not named <event>[-<variant>]-<n>.mp3 (lowercase, kebab-case)`);
}

writeFileSync(join(voiceDir, "manifest.json"), `${JSON.stringify({ files }, null, 2)}\n`);
console.log(`voice manifest: ${files.length} clip${files.length === 1 ? "" : "s"}`);
