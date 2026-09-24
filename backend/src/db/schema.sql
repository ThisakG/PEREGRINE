-- =============================================================================
-- schema.sql  (Member 02 - Matrix Creation & Search History)
-- -----------------------------------------------------------------------------
-- WHAT: The single table backing the search-history cache described in the
--       proposal (section 3.2, "History Check" stage): a previously
--       investigated IoC returns its stored matrix + AI summary instantly,
--       bypassing every external API call.
-- WHY these column choices:
--   - ioc_value + ioc_type together form the natural lookup key (a hash
--     "abc123" and a domain "abc123.com" must never collide).
--   - matrix_json / ai_json are stored as TEXT (JSON-serialized) rather than
--     spread across many columns, because the shape of a correlation matrix
--     legitimately varies (a domain has no "hash" field, etc.) - normalizing
--     that into rigid columns would fight the data rather than model it.
--   - created_at / updated_at let the frontend show "last checked" and
--     support an optional future cache-expiry policy without a schema change.
-- =============================================================================

CREATE TABLE IF NOT EXISTS ioc_history (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ioc_type      TEXT    NOT NULL CHECK (ioc_type IN ('ip', 'domain', 'hash', 'url')),
  ioc_value     TEXT    NOT NULL,
  matrix_json   TEXT    NOT NULL,   -- serialized correlation matrix (services/matrix/correlationMatrix.js output)
  ai_json       TEXT,               -- serialized AI synthesis (nullable: AI call may have failed - see responseParser.js fallback)
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (ioc_type, ioc_value)
);

-- Speeds up the cache-hit lookup that happens on EVERY search request -
-- this is the hottest query path in the whole application.
CREATE INDEX IF NOT EXISTS idx_ioc_history_lookup ON ioc_history (ioc_type, ioc_value);

-- Powers the "recent searches" history panel, newest first.
CREATE INDEX IF NOT EXISTS idx_ioc_history_created_at ON ioc_history (created_at DESC);
