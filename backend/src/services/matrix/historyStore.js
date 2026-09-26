// =============================================================================
// historyStore.js  (Member 02 - Matrix Creation & Search History)
// -----------------------------------------------------------------------------
// WHAT: All CRUD for the ioc_history table - the search-history cache. This
//       is the ONLY file in the codebase that writes raw SQL, by design,
//       so every query anyone might want to audit for injection risk lives
//       in one small, easy-to-review place.
// WHY every statement below uses "?" placeholders:
//       better-sqlite3's prepared statements send the SQL text and the
//       user-supplied values (the IoC string) to SQLite SEPARATELY. SQLite
//       never re-parses the value as part of the SQL grammar, which is why
//       parameterized queries fully close off SQL injection - even if
//       someone searched for an IoC value containing a literal apostrophe
//       or a `DROP TABLE` string, it is only ever treated as inert data.
// =============================================================================

import { db } from "../db/db.js";

const findStmt = db.prepare(
  `SELECT * FROM ioc_history WHERE ioc_type = ? AND ioc_value = ?`
);

const upsertStmt = db.prepare(`
  INSERT INTO ioc_history (ioc_type, ioc_value, matrix_json, ai_json, created_at, updated_at)
  VALUES (@iocType, @iocValue, @matrixJson, @aiJson, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  ON CONFLICT(ioc_type, ioc_value) DO UPDATE SET
    matrix_json = excluded.matrix_json,
    ai_json     = excluded.ai_json,
    updated_at  = strftime('%Y-%m-%dT%H:%M:%fZ','now')
`);

/**
 * Cache lookup - the "History Check" pipeline stage (proposal section 3.2).
 * @returns {{matrix:object, ai:object|null, cachedAt:string}|null}
 */
export function findCachedResult(ioc) {
  const row = findStmt.get(ioc.type, ioc.value);
  if (!row) return null;
  return {
    matrix: JSON.parse(row.matrix_json),
    ai: row.ai_json ? JSON.parse(row.ai_json) : null,
    cachedAt: row.updated_at,
  };
}

/**
 * Persists a freshly computed matrix (and, once available, the AI
 * synthesis) so future lookups of the same IoC are served from cache.
 * Member 03's responseParser.js calls this again once the AI result is
 * ready, updating the same row rather than creating a duplicate.
 */
export function saveResult(ioc, matrix, ai = null) {
  upsertStmt.run({
    iocType: ioc.type,
    iocValue: ioc.value,
    matrixJson: JSON.stringify(matrix),
    aiJson: ai ? JSON.stringify(ai) : null,
  });
}

/**
 * Powers the dashboard's history panel: the most recently looked-up IoCs.
 */
export function getRecent(limit = 20) {
  const stmt = db.prepare(
    `SELECT ioc_type, ioc_value, matrix_json, ai_json, created_at, updated_at
     FROM ioc_history ORDER BY updated_at DESC LIMIT ?`
  );
  return stmt.all(limit).map((row) => {
    const matrix = JSON.parse(row.matrix_json);
    return {
      iocType: row.ioc_type,
      iocValue: row.ioc_value,
      overallVerdict: matrix.overallVerdict,
      consolidatedConfidenceScore: matrix.consolidatedConfidenceScore,
      hasAiSummary: Boolean(row.ai_json),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}
