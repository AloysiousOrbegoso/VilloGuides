CREATE TABLE guide_notes (
  id          TEXT PRIMARY KEY,
  guide_id    TEXT NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  author      TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
