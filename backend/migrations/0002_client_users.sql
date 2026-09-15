CREATE TABLE client_users (
  id          TEXT PRIMARY KEY,
  client_id   TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin','support')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (client_id, email)
);
