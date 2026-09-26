-- =============================================================================
-- schema.sql  (Member 02 - Matrix Creation & Search History)
-- -----------------------------------------------------------------------------
-- UPDATED: no longer has a UNIQUE constraint on (ioc_type, ioc_value) - the
-- same IoC can now have multiple independent readings over time, each its
-- own row, so the history panel can offer old readings as a point of
-- comparison against a fresh search rather than overwriting them.
-- =============================================================================

CREATE TABLE IF NOT EXISTS ioc_history (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ioc_type      TEXT    NOT NULL CHECK (ioc_type IN ('ip', 'domain', 'hash', 'url')),
  ioc_value     TEXT    NOT NULL,
  matrix_json   TEXT    NOT NULL,
  ai_json       TEXT,
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Speeds up lookups/filtering by a specific IoC value across its multiple readings.
CREATE INDEX IF NOT EXISTS idx_ioc_history_lookup ON ioc_history (ioc_type, ioc_value);

-- Powers the "recent searches" history panel, newest first.
CREATE INDEX IF NOT EXISTS idx_ioc_history_created_at ON ioc_history (created_at DESC);