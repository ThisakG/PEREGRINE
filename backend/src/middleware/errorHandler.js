// =============================================================================
// errorHandler.js (integration layer)
// -----------------------------------------------------------------------------
// WHAT: Express's centralized error-handling middleware (4-arg signature),
//       registered LAST in app.js so it catches anything thrown/passed to
//       next() anywhere upstream.
// WHY we never send error.stack or error.message from unexpected errors to
// the client:
//       Stack traces can reveal file paths, dependency versions, and
//       sometimes fragments of the request context - useful to an
//       attacker, not to an analyst. We log the full detail server-side
//       (where only the team can see it) and return a generic message to
//       the client. Errors that are SAFE to show (validation errors) are
//       instead handled at their own call site with res.status(400) - see
//       validateIoc.js - and never reach this generic handler.
// =============================================================================

import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, _next) {
  logger.error("Unhandled request error", {
    path: req.path,
    method: req.method,
    message: err.message,
    stack: err.stack,
  });

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "Origin not allowed." });
  }

  res.status(500).json({ error: "An unexpected error occurred. Please try again." });
}
