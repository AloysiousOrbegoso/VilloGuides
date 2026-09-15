CREATE TABLE guides (
  id                 TEXT PRIMARY KEY,
  client_id          TEXT NOT NULL REFERENCES clients(id),
  slug               TEXT UNIQUE,
  status             TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','in_review','published','unpublished','suspended')),
  draft              TEXT NOT NULL,
  published_version  INTEGER,
  published_at       TEXT,
  paid               INTEGER NOT NULL DEFAULT 0,
  payment_method     TEXT,
  payment_amount     INTEGER,
  payment_currency   TEXT,
  payment_reference  TEXT,
  paid_at            TEXT,
  owner_name         TEXT,
  city               TEXT,
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_guides_client ON guides(client_id);
CREATE INDEX idx_guides_status ON guides(status);
