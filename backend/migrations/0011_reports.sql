-- Guide reports (architecture 5.1, 5.5, 9.4). Not in architecture 8.1's
-- original table list; added in Phase 5 alongside real rate limiting on
-- this endpoint, replacing the audit_log-only placeholder from Phase 2.
CREATE TABLE reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  guide_slug  TEXT NOT NULL,
  reason      TEXT NOT NULL,
  details     TEXT,
  email       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_reports_slug ON reports(guide_slug);
