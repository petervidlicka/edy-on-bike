/**
 * Display-name cleanup shared by the leaderboard API and the multiplayer server. Names are
 * shown to every player (it's a kids' game), so they are normalised and screened for
 * obvious abuse. Pure and dependency-free: the Worker bundles it too.
 */

/**
 * Words rejected anywhere in a name, even inside longer words or with symbols between
 * the letters. Only words with no innocent use as part of a name belong here.
 */
const BLOCKED_ANYWHERE = [
  "fuck", "shit", "cunt", "nigger", "nigga", "faggot", "whore", "bitch", "asshole",
  "pussy", "penis", "vagina", "porn", "hitler", "retard", "twat", "bastard", "dildo",
];

/**
 * Words rejected only as a whole word, because they also appear inside ordinary names
 * or words ("Dickson", "Hancock", "Grape", "Cassie", "Swanky", "therapist").
 */
const BLOCKED_WORDS = new Set([
  "ass", "dick", "cock", "fag", "rape", "rapist", "nazi", "sex", "slut", "kkk", "tits",
  "cum", "wank", "wanker",
]);

/** Common letter substitutions ("sh1t", "@ss") folded back before matching. */
const LOOKALIKES: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "!": "i",
};

/**
 * Normalises a typed name: Unicode NFKC (folds full-width and styled letters), drops
 * control and invisible formatting characters (zero-width joiners, RTL overrides),
 * collapses whitespace and trims.
 * @returns The cleaned name; may be empty.
 * @example cleanPlayerName("  Edy​  Rider ") // "Edy Rider"
 */
export function cleanPlayerName(raw: string): string {
  return raw.normalize("NFKC").replace(/\p{C}/gu, "").replace(/\s+/g, " ").trim();
}

/**
 * Whether a cleaned name is fit to show on a public board.
 * @example isPlayerNameAllowed("Sh1t Rider") // false
 */
export function isPlayerNameAllowed(name: string): boolean {
  const folded = Array.from(name.toLowerCase(), (ch) => LOOKALIKES[ch] ?? ch).join("");
  const lettersOnly = folded.replace(/[^\p{L}]/gu, "");
  if (BLOCKED_ANYWHERE.some((word) => lettersOnly.includes(word))) return false;
  return !folded.split(/[^\p{L}]+/u).some((word) => BLOCKED_WORDS.has(word));
}
