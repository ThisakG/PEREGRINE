// =============================================================================
// historyStore.js  (Member 02 - Matrix Creation & Search History)
// -----------------------------------------------------------------------------
// UPDATED: this module used to treat "history" as a cache keyed on the IoC
// value (one row per IoC, overwritten on every lookup). It now treats every
// search as a new, independent READING that is always inserted as a new
// row - so the same IoC can have several readings over time, and the
// history panel's job is letting the analyst open an older reading
// (read-only, in a new tab) to compare against a fresh one. This is a
// deliberate trade-off: more external API/AI usage per repeat search, in
// exchange for the ability to see whether an indicator's reputation has
// changed since it was last checked.
// =============================================================================

import { db } from "../../db/db.js";

const insertStmt = db.prepare(`
  INSERT INTO ioc_history (ioc_type, ioc_value, matrix_json, ai_json, created_at, updated_at)
  VALUES (@iocType, @iocValue, @matrixJson, @aiJson, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))
`);

const updateAiStmt = db.prepare(`
  UPDATE ioc_history SET ai_json = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?
`);

const findByIdStmt = db.prepare(`SELECT * FROM ioc_history WHERE id = ?`);

/**
 * Inserts a brand-new reading (matrix only - AI isn't ready yet at this
 * point in the pipeline). Returns the new row's id.
 */
export function insertResult(ioc, matrix, ai = null) {
  const info = insertStmt.run({
    iocType: ioc.type,
    iocValue: ioc.value,
    matrixJson: JSON.stringify(matrix),
    aiJson: ai ? JSON.stringify(ai) : null,
  });
  return info.lastInsertRowid;
}

/**
 * Called once the AI synthesis step finishes, to attach it to the reading
 * that was already inserted - so the reading is never lost even if the AI
 * call fails or is slow.
 */
export function updateAiForRow(id, ai) {
  updateAiStmt.run(JSON.stringify(ai), id);
}

/**
 * Fetches ONE specific historical reading by its id. This is what powers
 * both the "open in new tab" history view and the export endpoints - both
 * need an exact, unambiguous reading, not "whatever is cached for this IoC
 * value" (which is now ambiguous, since there can be many).
 */
export function findById(id) {
  const row = findByIdStmt.get(id);
  if (!row) return null;
  return {
    id: row.id,
    ioc: { type: row.ioc_type, value: row.ioc_value },
    matrix: JSON.parse(row.matrix_json),
    ai: row.ai_json ? JSON.parse(row.ai_json) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Powers the dashboard's history panel: the most recent readings across
 * all IoCs, newest first. The same IoC value may legitimately appear more
 * than once here now - that's the intended comparison feature.
 */
export function getRecent(limit = 20) {
  const stmt = db.prepare(
    `SELECT id, ioc_type, ioc_value, matrix_json, ai_json, created_at, updated_at
     FROM ioc_history ORDER BY created_at DESC LIMIT ?`
  );
  return stmt.all(limit).map((row) => {
    const matrix = JSON.parse(row.matrix_json);
    return {
      id: row.id,
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