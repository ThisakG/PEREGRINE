// =============================================================================
// rateLimiter.js (integration layer)
// -----------------------------------------------------------------------------
// WHAT: Two rate limiters - a lenient general one for the whole API, and a
//       stricter one specifically for the IoC lookup endpoint.
// WHY the lookup endpoint gets its own, tighter limit:
//       Every cache-miss lookup fans out to 3-4 external threat-intel APIs
//       AND a Gemini call - all of which run on free-tier quotas. Without a
//       per-IP limit here, a single careless script (or a malicious actor)
//       could burn through the whole team's daily VirusTotal/Gemini quota
//       in seconds. This is as much a quota-protection control as a
//       traditional "prevent abuse" control.
// =============================================================================

import rateLimit from "express-rate-limit";

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const lookupLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10, // 10 IoC lookups/minute/IP - generous for a single analyst, tight enough to protect free-tier quota
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many lookups. Please wait a moment before searching again." },
});
