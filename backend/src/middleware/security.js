// =============================================================================
// security.js (integration layer)
// -----------------------------------------------------------------------------
// WHAT: Cross-cutting HTTP security middleware applied to every request:
//       Helmet's secure header defaults + a strict, allow-list-based CORS
//       policy.
// WHY:
//   - Helmet sets headers like X-Content-Type-Options, sets a conservative
//     default Content-Security-Policy, and disables X-Powered-By (which
//     otherwise advertises "Express" to anyone probing the API).
//   - CORS is configured from env.corsAllowedOrigins (see config/env.js)
//     rather than "cors()" with no options (which defaults to allowing
//     ALL origins) - a threat-intel dashboard should only ever be called
//     from its own known frontend, not from an arbitrary third-party page
//     that could otherwise ride the analyst's session in their browser.
// =============================================================================

import helmet from "helmet";
import cors from "cors";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const helmetMiddleware = helmet();

export const corsMiddleware = cors({
  origin(origin, callback) {
    // Requests with no Origin header (curl, server-to-server, same-origin)
    // are allowed through - CORS is a browser-enforced concept and doesn't
    // apply to those callers anyway.
    if (!origin || env.corsAllowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    logger.warn("Blocked request from disallowed CORS origin", { origin });
    callback(new Error("Not allowed by CORS"));
  },
});
