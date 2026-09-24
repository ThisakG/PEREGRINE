// =============================================================================
// env.js
// -----------------------------------------------------------------------------
// WHAT: Single, central place that loads and validates environment variables.
// WHY:  Secure-coding practice - "never scatter process.env.X reads across
//       the codebase". Centralizing them here means:
//         (a) every secret has exactly one place it is read from, making it
//             easy to audit what the app actually uses,
//         (b) we can fail fast and loudly at startup if something required
//             is missing, instead of an external API call mysteriously
//             failing 500 requests deep into a demo,
//         (c) nothing downstream ever needs to import "dotenv" itself.
// =============================================================================

import dotenv from "dotenv";

// Loads variables from a local ".env" file in development. On a real host
// (Render/Railway/Vercel/etc.) the platform injects env vars directly and
// this call is a harmless no-op because no .env file exists there.
dotenv.config();

/**
 * Small helper: reads an env var, optionally enforcing that it is present.
 * Centralizing "required" checks here means a missing secret is caught
 * once, at boot, with a clear error - not as a cryptic crash mid-request.
 */
function readEnv(name, { required = false, fallback = undefined } = {}) {
  const value = process.env[name];
  if ((value === undefined || value === "") && required) {
    throw new Error(
      `[config] Missing required environment variable "${name}". ` +
        `Copy backend/.env.example to backend/.env and fill it in.`
    );
  }
  return value === undefined || value === "" ? fallback : value;
}

export const env = {
  nodeEnv: readEnv("NODE_ENV", { fallback: "development" }),
  port: Number(readEnv("PORT", { fallback: "8080" })),

  // CORS allow-list, parsed once here rather than re-splitting a string
  // every request. An empty/unset value intentionally falls back to
  // nothing allowed, rather than "*", so a mis-configured deployment fails
  // closed (blocks the frontend, safe) instead of failing open (permits
  // any origin, unsafe).
  corsAllowedOrigins: readEnv("CORS_ALLOWED_ORIGINS", { fallback: "" })
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  threatIntel: {
    virusTotalApiKey: readEnv("VIRUSTOTAL_API_KEY", { required: true }),
    abuseIpdbApiKey: readEnv("ABUSEIPDB_API_KEY"),
    otxApiKey: readEnv("OTX_API_KEY"),
    // Deliberately NOT required=true - see ciscoTalos.js for why this
    // source is currently a documented stub rather than a live call.
    ciscoTalosApiKey: readEnv("CISCO_TALOS_API_KEY"),
  },

  gemini: {
    // Collected into an array and filtered so the key-rotation pool
    // (services/ai/geminiKeyPool.js) can work with however many of the
    // 4 free-tier keys the user actually supplied.
    apiKeys: [
      readEnv("GEMINI_API_KEY_1"),
      readEnv("GEMINI_API_KEY_2"),
      readEnv("GEMINI_API_KEY_3"),
      readEnv("GEMINI_API_KEY_4"),
    ].filter(Boolean),
    model: readEnv("GEMINI_MODEL", { fallback: "gemini-2.0-flash" }),
  },

  db: {
    path: readEnv("SQLITE_DB_PATH", { fallback: "./data/peregrine.sqlite" }),
  },
};

// Fail fast: an AI-assisted dashboard with zero usable Gemini keys can still
// boot (it will serve matrix-only results, see responseParser.js fallback
// path) but it should not boot with zero threat-intel sources - that is the
// whole point of the product, so we surface that misconfiguration loudly.
if (
  !env.threatIntel.virusTotalApiKey &&
  !env.threatIntel.abuseIpdbApiKey &&
  !env.threatIntel.otxApiKey
) {
  throw new Error(
    "[config] No threat-intelligence source API keys are configured. " +
      "At least one of VIRUSTOTAL_API_KEY, ABUSEIPDB_API_KEY, OTX_API_KEY is required."
  );
}
