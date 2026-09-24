// =============================================================================
// validateIoc.js (integration layer, wraps Member 01's iocDetector.js)
// -----------------------------------------------------------------------------
// WHAT: Express middleware that validates req.body.ioc before any route
//       handler logic runs, attaching the parsed { type, value } to
//       req.validatedIoc on success.
// WHY as middleware rather than inline in the route handler:
//       Keeps routes/iocRoutes.js focused purely on orchestration
//       (cache check -> fan-out -> matrix -> AI -> save), and guarantees
//       no handler can ever accidentally skip validation - it simply never
//       receives control if the IoC is malformed.
// =============================================================================

import { detectIoc } from "../utils/iocDetector.js";

export function validateIocBody(req, res, next) {
  const { ioc } = req.body ?? {};

  if (typeof ioc !== "string") {
    return res.status(400).json({ error: "Request body must include an \"ioc\" string field." });
  }

  try {
    req.validatedIoc = detectIoc(ioc);
    next();
  } catch (error) {
    // error.message is safe to return - iocDetector.js only ever throws
    // fixed, developer-authored strings (never echoes raw user input back
    // into the message), so there's no reflected-input concern here.
    res.status(400).json({ error: error.message });
  }
}
