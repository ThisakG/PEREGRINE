// =============================================================================
// db.js  (Member 02 - Matrix Creation & Search History)
// -----------------------------------------------------------------------------
// WHAT: Opens (and, on first boot, initializes) the SQLite database used as
//       the search-history / matrix cache.
// WHY better-sqlite3 specifically:
//   - Synchronous API, which is fine here because SQLite reads/writes on a
//     local file are sub-millisecond - no event-loop-blocking concern at
//     this scale, and it removes a whole class of async/await bugs.
//   - Everywhere in this codebase that touches SQL uses PARAMETERIZED
//     statements (the "?" placeholders you'll see in historyStore.js),
//     never string concatenation of user input into SQL text. That is the
//     standard, complete defense against SQL injection - see
//     historyStore.js for where the actual queries live.
// =============================================================================

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const dbFilePath = env.db.path;

// Ensure the containing directory exists (e.g. "./data") before SQLite
// tries to create the file - avoids a confusing ENOENT on first run.
const dbDir = path.dirname(dbFilePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbFilePath);

// WAL mode allows concurrent reads while a write is in flight, which suits
// a small web API better than SQLite's default rollback-journal mode.
db.pragma("journal_mode = WAL");

// Foreign keys aren't used in this single-table schema yet, but enabling
// this pragma is a defensive default so it's already correct the moment
// a second table (e.g. a future users table) is added.
db.pragma("foreign_keys = ON");

const schemaPath = path.join(path.dirname(new URL(import.meta.url).pathname), "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf-8");
db.exec(schema);

logger.info("SQLite database ready", { path: dbFilePath });
