CREATE TABLE slug_history (
  slug        TEXT PRIMARY KEY,
  guide_id    TEXT NOT NULL REFERENCES guides(id),
  retired_at  TEXT
);
