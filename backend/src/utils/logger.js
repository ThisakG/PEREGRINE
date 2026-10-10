// =============================================================================
// logger.js
// -----------------------------------------------------------------------------
// WHAT: A minimal structured logger.
// WHY:  Secure-coding practice - logs are one of the most common places
//       secrets accidentally leak (a developer does `console.log(config)`
//       while debugging and an API key ends up in a hosting platform's log
//       viewer, which is often less locked-down than the secrets store
//       itself). `redact()` below is the safeguard: every log call is
//       expected to pass through it, so a stray key/token is masked before
//       it ever reaches stdout.
// =============================================================================

const SECRET_KEY_PATTERN =
  /(key|token|secret|authorization)/i;

/**
 * Recursively walks an object and masks any value whose KEY NAME looks like
 * a secret (apiKey, token, Authorization header, etc.), regardless of what
 * the value itself looks like. This is intentionally conservative - it
 * would rather over-redact than leak a real key into logs.
 */
function redact(payload) {
  if (payload === null || typeof payload !== "object") return payload;
  if (Array.isArray(payload)) return payload.map(redact);

  const clone = {};
  for (const [key, value] of Object.entries(payload)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      clone[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      clone[key] = redact(value);
    } else {
      clone[key] = value;
    }
  }
  return clone;
}

function timestamp() {
  return new Date().toISOString();
}

export const logger = {
  info(message, meta = {}) {
    console.log(`[${timestamp()}] [INFO] ${message}`, redact(meta));
  },
  warn(message, meta = {}) {
    console.warn(`[${timestamp()}] [WARN] ${message}`, redact(meta));
  },
  error(message, meta = {}) {
    console.error(`[${timestamp()}] [ERROR] ${message}`, redact(meta));
  },
};
