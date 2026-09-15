CREATE TABLE guide_versions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  guide_id    TEXT NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  content     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (guide_id, version)
);
