CREATE TABLE change_requests (
  id          TEXT PRIMARY KEY,
  guide_id    TEXT REFERENCES guides(id),
  client_id   TEXT NOT NULL REFERENCES clients(id),
  type        TEXT NOT NULL CHECK (type IN ('edit','removal','new_property')),
  body        TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','done','declined')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
