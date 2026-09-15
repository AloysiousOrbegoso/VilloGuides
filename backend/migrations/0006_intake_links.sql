CREATE TABLE intake_links (
  token         TEXT PRIMARY KEY,
  guide_id      TEXT NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'sent'
                CHECK (status IN ('sent','in_progress','submitted','expired')),
  answers       TEXT,
  submitted_at  TEXT,
  expires_at    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
