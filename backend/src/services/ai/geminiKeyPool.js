// =============================================================================
// geminiKeyPool.js  (Member 03 - AI Parsing & Output Generation)
// -----------------------------------------------------------------------------
// WHAT: Manages rotation across the (up to 4) free-tier Gemini API keys
//       supplied for this project, so no single key's free-tier quota is
//       exhausted by itself while the others sit unused.
// WHY round-robin + automatic fail-over (not "just use key #1 always"):
//   - Free-tier Gemini quotas are per-key, per-minute/day. Round-robin
//     spreads normal traffic evenly across all keys so the app can sustain
//     roughly (numberOfKeys x per-key quota) total throughput.
//   - If a key IS rate-limited (Gemini returns HTTP 429) or otherwise
//     rejected, callAllowingRotation() in geminiClient.js retries with the
//     NEXT key rather than failing the whole request - from the analyst's
//     point of view the AI synthesis should "just work" as long as at
//     least one key still has quota left.
//   - Keys are only ever read from config/env.js (which itself only reads
//     from process.env) - this file never hardcodes a key value, and never
//     logs a raw key (see logger.js's redact()).
// =============================================================================

import { env } from "../../config/env.js";

let cursor = 0;

/**
 * Returns the pool of configured Gemini keys, in a rotated order starting
 * from the current cursor position, then advances the cursor for the next
 * call. Callers should try keys in the returned order and stop at the
 * first success.
 */
export function getRotatedKeyOrder() {
  const keys = env.gemini.apiKeys;
  if (keys.length === 0) return [];

  const rotated = [...keys.slice(cursor), ...keys.slice(0, cursor)];
  cursor = (cursor + 1) % keys.length;
  return rotated;
}

export function hasAnyGeminiKey() {
  return env.gemini.apiKeys.length > 0;
}
