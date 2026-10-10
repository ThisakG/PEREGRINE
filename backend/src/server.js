// =============================================================================
// server.js (integration layer - the actual process entry point)
// -----------------------------------------------------------------------------
// WHAT: Boots the HTTP server. Kept separate from app.js so the Express
//       app itself can be imported and tested (e.g. with supertest)
//       without binding a real network port.
// =============================================================================

import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import "./db/db.js"; // side-effecting import: initializes the SQLite schema at boot

app.listen(env.port, () => {
  logger.info(`Peregrine backend listening`, { port: env.port, env: env.nodeEnv });
});
